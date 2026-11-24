// imports
const express = require("express") //importing express package
const app = express() // creates a express application
const dotenv = require("dotenv").config() //this allows me to use my .env values in this file
const morgan = require('morgan')
const cors = require('cors')

// Routes Import
const authRoutes = require('./routes/auth.routes')
const packageRoutes= require("./routes/package.routes")
const bookingRoutes=  require("./routes/booking.routes")
const publicEventsRoutes= require("./routes/publicEvent.routes")
const contactMessages= require("./routes/contactMessage.routes")






// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
    })
);
app.use(express.json())
app.use(morgan('dev'))



// Routes
app.use('/auth',authRoutes)
app.use("/packages", packageRoutes)
app.use("/bookings", bookingRoutes)
app.use("/public-events", publicEventsRoutes)
app.use("/contact-messages", contactMessages)

module.exports = app