const {app, PORT } = require ('./config');
require ('./app');

// Iniciar server
app.listen(PORT, ()=> {
    console.log(`servidor inciiado en el puerto:${PORT}`);
})