const {app} = require ('./config');
const db = require('./db');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


app.use(bodyParser.urlencoded({ extended: true }));

// ruta de la url Index

app.get('/', (req, res) => {
    res.render('index');
});


// ruta de la Logueo
app.get('/login', (req, res) => {
    res.render('login');
});


// ruta de la registro
app.get('/registro', (req, res) => {
    res.render('registro');
});

// Crear la ruta de registro de usuario
app.post('/registro', async (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query('INSERT INTO usuarios (nombre, apellidos, email, password) VALUES (?, ?, ?, ?)', [nombre, apellido, email, hashedPassword], (err, result) => {
        if(err){
            console.log(err);
            res.send('Error al registrar usuario');
        }else {
            console.log(result);
            res.redirect('login');
        }
    });
});



module.exports = app;


