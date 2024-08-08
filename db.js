const mysql = require ('mysql');
const {dbconfig} = require ('./config');

// crear la conexion a la base de datos 

const connection = mysql.createConnection(dbconfig);

connection.connect((err) => {
    if(err){
        console.error('Eroor al conectar a la base de datos¡¡¡¡');
        return
    }
    console.log('conexion a la base de datos exitos');
});

module.exports = connection;