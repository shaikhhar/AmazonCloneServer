const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const config = require('./config');

app = express();

mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("connected to database");
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));

app.use('/uploads', express.static('uploads'));

const userRoutes = require('./routes/account');
const mainRoutes = require('./routes/main');
const sellerRoutes = require('./routes/seller');

app.use('/api', mainRoutes);
app.use('/api/accounts', userRoutes);
app.use('/api/seller', sellerRoutes);




app.listen(config.port, () => {
    console.log("server running at " + config.port);
});