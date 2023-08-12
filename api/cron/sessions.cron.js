const cron = require('node-cron');
const {exec} = require("child_process");
const {DateTime} = require("luxon");
const { config } = require('dotenv')
const mongoose = require("mongoose");
config()
