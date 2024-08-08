const express = require ('express');
const path = require ('path');

const app= express();
const PORT = process.env.PORT || 3000;


// resolver las rutas statics 
app.use (express.static("public"));

// rutas de motos de vistas 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'));

// configurar base de datos 

const dbconfig ={
    host : 'localhost',
    user: 'root',
    password: '',
    database: 'apptech'
}


module.exports = {app, PORT, dbconfig };