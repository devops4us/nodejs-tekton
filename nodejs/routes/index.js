const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");
require('dotenv').config();

var rest_api_ip   = process.env.OPENLIBERTY_APP_SERVICE_HOST || process.env.LIBERTY_APP_SERVICE_HOST || process.env.LIBERTY_TEKTON_SERVICE_HOST || 'liberty-app';
var rest_api_port = process.env.OPENLIBERTY_APP_SERVICE_PORT || process.env.LIBERTY_APP_SERVICE_PORT || process.env.LIBERTY_TEKTON_SERVICE_PORT || '9080';

const AUTHORS_API_KEY = process.env.AUTHORS_API_KEY || 'none' ;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { weather: null, err: null, links: null, error_authors: null });
});

router.post('/get_links', async function (req,res) {
  let author = req.body.author;
  let url = `http://${rest_api_ip}:${rest_api_port}/authors/v1/getauthor?name=${author}`;
  let health_url = `http://${rest_api_ip}:${rest_api_port}/health`;


  /* Check if Secret was mountes. */
  if(AUTHORS_API_KEY == 'none') {
    res.render('index', {links: null, error_authors: 'Error: It seems the secret AUTHORS_API_KEY is not set. Please mount the secret `authors-secret-api` as an Environment Variable inside Pod.'});
  }
  else {
    /* Perform HEALTH Check to OpenLiberty Authors API. */
    try {
      let data = await fetch(health_url);
      let health = await data.json();
      console.log("Health check for OpenLiberty API.");
      console.log(health);
      if(health.outcome != 'UP') {
        console.log('Error: OpenLiberty API Server seems to be down. Please check.');
        res.render('index', {links: null, error_authors: 'Error: OpenLiberty API Server seems to be down. Please check.'});
        return;
      }
    }  
    catch (err) {
      console.log('Error: Unable to invoke OpenLiberty API Health Check. Please check if OpenLiberty server is online.');
      res.render('index', {links: null, error_authors: 'Error: Unable to invoke OpenLiberty API Health Check. Please check if OpenLiberty server is online.'});
      return;
    }
    /* Perform the call to  OpenLiberty Authors API. */
    try {
      let data = await fetch(url);
      let links = await data.json();
      console.log(links);
      if(links.cod == '404' && links.main == undefined) {
        res.render('index', {links: null, error_authors: 'Error: Unknown author.'});
      }      
      else {
        res.render('index', {links: links, error_authors: null});
      }
    }
    catch (err) {
      console.log(err);
      res.render('index', {links: null, error_authors: 'Error: Unable to invoke OpenLiberty API. Please check if OpenLiberty server is online.'});
    }
  }  
});

module.exports = router;
