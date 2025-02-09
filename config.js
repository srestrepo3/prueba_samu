const express = require ('express');
const multer = require('multer');
const path = require ('path');
const session = require('express-session');
const morgan = require('morgan'); 

const app= express();
const PORT = process.env.PORT || 3000;

// Midelware
app.use(morgan('dev'));


// Configurar la sesion
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true
}));

// Configurar API de pagos PYu
const PAYU_API_URL = 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi';
const API_KEY = 'hzNgjH5jWVgx26NQj4q7U37QEC';
const MERCHAN_ID = '508029';
const ACCOUNT_ID = '512321' ;
const API_LOGIN = '1UAQ2ens3cbIA34';

// Configurar multer para manejar la subida de archivos
const storage = multer.diskStorage ({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.round() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Resolver la ruta de los uploads
app.use('/uploads', express.static('uploads'));


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


module.exports = {app, PORT, dbconfig,session,upload,PAYU_API_URL , API_KEY ,MERCHAN_ID,ACCOUNT_ID ,API_LOGIN};