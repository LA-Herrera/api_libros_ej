const apiUrl = '/api';
let token;

async function fetchBooks() {
    const response = await fetch(apiUrl);
    const books = await response.json();
    const booksTable = document.querySelector('#table_libros tbody');
    booksTable.innerHTML = '';

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.titulo}</td>
            <td>${book.autores.join(', ')}</td>
            <td>${book.categoria}</td>
            <td>
                <button onclick="delete_libro('${book._id}')">Eliminar</button>
                <button onclick="update_libro('${book._id}', '${book.titulo}', '${book.autores}', '${book.categoria}')">Editar</button>
            </td>
            `;
        booksTable.appendChild(row);
    });
}

document.getElementById('create_libro').addEventListener('submit', async(event)=>{
    event.preventDefault()
})

async function addBook(){
    const titulo = document.getElementById('title').value;
    const autores = document.getElementById('authors').value.split(',');
    const categoria = document.getElementById('category').value;

    await fetch(apiUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
        body: JSON.stringify({titulo, autores, categoria}),
    })
    .catch((error)=>console.log(error));

    document.getElementById('create_libro').reset();
    fetchBooks();
}

async function delete_libro(id) {
    await fetch(`${apiUrl}/${id}`,{ 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`,
            },
        }
    );
    fetchBooks();
}

function update_libro(id, titulo, autores, categoria) {
    document.getElementById('s-btn').innerText = 'Editar Libro'
    document.getElementById('title').value = titulo;
    document.getElementById('authors').value = autores;
    document.getElementById('category').value = categoria;

    document.getElementById('create_libro').onsubmit = async (event) => {
        event.preventDefault();
        const updatedTitle = document.getElementById('title').value;
        const updatedAuthors = document.getElementById('authors').value.split(',').map(author => author.trim());
        const updatedCategory = document.getElementById('category').value;

        await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `${token}` 
            },
            body: JSON.stringify({ titulo: updatedTitle, autores: updatedAuthors, categoria: updatedCategory }),
        });

        document.getElementById('create_libro').reset();
        document.getElementById('s-btn').innerText = 'Agregar Libro';
        document.getElementById('create_libro').onsubmit = addBook;
        fetchBooks();
    };
}

fetchBooks();

document.getElementById('login').addEventListener('submit', async(event) =>{
    event.preventDefault();
    const user = document.getElementById('user').value;
    const passcode = document.getElementById('pass').value;

    await fetch(`/login`, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: user, passcode: passcode})
    })
    .then(response => response.json())
    .then(S => {
        switch(S.b){
			case 0:
                console.log("loggedin");
                document.getElementById('l_ctn').style.display = "none";
                token = S.token;
                sessionStorage.setItem('authToken', token);;
				break;
			case 1:
                console.log("user error");
				break;
		}
    })
    .catch((error) => console.error(error));
})


document.addEventListener('DOMContentLoaded', () => {
    token = sessionStorage.getItem('authToken');
    if (token) {
      fetch('/verify-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`,
        }
      })
      .then(response => {
        if (response.ok) {
            document.getElementById('l_ctn').style.display = "none";
            console.log('Usuario autenticado');
        } else {
          sessionStorage.removeItem('authToken');
          document.getElementById('l_ctn').style.display = "flex";
        }
      })
      .catch(() => {
        console.error('Error verificando token');
        document.getElementById('l_ctn').style.display = "flex";
      });
    }
});