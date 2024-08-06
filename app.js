const {app} = require ('./config');

// ruta de la url

app.get('/', (req, res) => {
    res.render('index');
});