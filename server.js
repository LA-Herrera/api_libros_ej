const dotenv = require('dotenv');                   
const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');             
const jwt = require('jsonwebtoken');
const path = require('path');

const conn_db = async () => {                     
    try {
        await mongoose.connect(`mongodb+srv://LA:8xuujBGISROFCm0V@cluster0.0jcmd.mongodb.net/api_libros?retryWrites=true&w=majority&appName=Cluster0`)
        const dbAdmin = mongoose.connection.db.admin();
        const dbs = await dbAdmin.listDatabases();
        if(!dbs.databases.some((db) => db.name === process.env.DATABASE)){
            console.error('Base de datos no encontrada')
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
mongoose.connection.on('connected', () =>{
    console.log('Conexion establecida');
});
mongoose.connection.on('disconnected', () =>{
    console.log('Conexion deshabilitada');
});


const app = express();                             
dotenv.config();
conn_db();                                  

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')));

const verify = async(req, res, next) => {       //la funcion de middleware verifica si la solicitud es autorizada o no
    let jwtSecret = process.env.JWT_SECRET;
    try {
        const token = req.header('Authorization');  //consigue la token que viene en la cabecera de la solicitud
        const verified = jwt.verify(token, jwtSecret);  //compara la token mandada en la solicitud con el secreto
        if(verified){
            console.log("Verificado Exitosamente");
            next();                                     //pasa a la siguiente funcion
        }else{
            return res.status(401).send(error);         //la solicitud no fue autorizada 
        }
    } catch (error) {
        return res.status(401).send(error);
    }
};

const libro = new mongoose.Schema(
    {
        titulo: {type: String, required: true},
        autores: {type: [String], required:true},
        categoria: {type: String, required: true},
    },
    {
        timestamps: true,
    }
);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

const Libro = mongoose.model('Libro', libro, 'libros');

app.post('/verify-token', verify, (req, res) =>{            //verifica la token que tiene el usuario
    res.status(200).json({message: 'Token verificada'});
});

app.get('/api', async (req, res) =>{                        //obtiene la lista de libros guardados en la base de datos
    try {
        const L = await Libro.find();
        res.status(200).json(L);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/:id', verify, async (req, res) =>{            //primero verifica si la solicitud esta autorizada y luego busca un libro en especifico
    try {
        const L = await Libro.find({_id: req.params.id});
        if(!L){
            return res.status(404).json({message: 'Libro no encontrado'});
        }
        res.status(200).json(L);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.post('/api', verify, async (req, res) =>{               //verifica si la solicitud esta autorizada y luego agregar un nuevo libro a la bade de datos
    const {titulo, autores, categoria} = req.body;
    try {
        const nL = new Libro({titulo, autores, categoria})
        await nL.save();
        res.status(201).json(nL);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

app.put('/api/:id', verify, async (req, res) => {           //verifica si la solicitud esta autorizada y luego edita los datos de un libro
    const {titulo, autores, categoria} = req.body;
    try {
        const aL = await Libro.updateOne({_id: req.params.id}, {
            $set: {
                titulo: titulo,
                autores: autores,
                categoria: categoria
            }
        }, {upsert: false});
        if(!aL){
            res.status(404).json({message: 'Libro no encontrado'})
            return;
        }
        res.status(200).json(aL);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.delete('/api/:id', verify, async (req, res) => {    //verifica si la solicitud esta autorizada y luego elimina un libro
    try {
        const bL = await Libro.deleteOne({_id: req.params.id});
        if(!bL){
            return res.status(404).json({message: 'Libro no encontrado'});
        }
        res.json({message: 'Libro borrado exitosamente'})
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.post('/login', (req, res) =>{                   //inicia sesion
    let A = {
        a: false,
        b: 0,           //0 para inicio de sesion, 1 para error de usuario(contraseña o usuario incorrecto)
        token: null     //token generada para el usuario en caso que logre iniciar sesion
    };
    if(req.body.username !== process.env.USER || req.body.passcode !== process.env.PASSWORD){   //verifica los datos ingresados por el usuario
        A.b = 1;
        res.json(A);
    }else{
        A.a = true;
        A.b = 0;

        let jwtSecret = process.env.JWT_SECRET;
        let data = {
            time: Date()
        }
        const token = jwt.sign(data, jwtSecret, {expiresIn: '1h'}); //genera una token para el usuario con vida de 1 hora
        A.token = token;                                       
        res.status(200).json(A);
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
