const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require('body-parser');
const userRoutes = require("./routes/userRoutes");
const axios = require('axios');
const cron = require('node-cron');

const app = express()

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log('Connected & Server is running on ' + process.env.PORT + '...');
    })

    cron.schedule('*/2 * * * *', () => {
        axios.patch('http://127.0.0.1:8888/users/match_popularity')
            .then(res => {
                console.log(res.data.message);
            })
            .catch(err => {
                console.error(err.message);
            });
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });
})
.catch((err) => {
    console.log(err);
    return
})

/* middleware & static files*/
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));
app.use(morgan("dev"))

/*  -> static files */
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true })) // parse url-encoded data
app.use(express.json())

/* routes */
app.get("/", (req, res) => {
    res.status(200).json({ message: "ok" })
})

app.use('/users', userRoutes)

/* 404 page */
app.use((req, res) => {
    res.status(404).json({ message: "404 Not Found"})
})