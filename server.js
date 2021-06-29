const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const morgan = require('morgan')
require('dotenv').config()

//route

const authRoute = require('./routes/auth')
const user = require('./routes/user')

const app = express()

//connect to database
mongoose.connect(process.env.LOCAL_DB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then( () => console.log("DB connected"))
.catch((err) => console.log('Db error', err))

//middlewares
app.use(morgan('dev'))
app.use(express.json())
app.use(cors()); 

// if(process.env.NODE_ENV = 'development'){
//     app.use(cors({ origin: 'http://localhost:3000'}))
// }


app.use('/api', authRoute)
app.use('/api', user)

const port = process.env.PORT || 8000

app.listen(port, () => {
    console.log(`Api is running on port ${port} - mode is ${process.env.NODE_ENV}`)
})