// Modified to support Atom

// URL of the RSS feed to parse
var RSS_FEED_URL = "https://cloudblog.withgoogle.com/products/gcp/rss/";

// Webhook URL of the Hangouts Chat room
var WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/[SPACE_ID]/messages?key=[KEY]";

// When DEBUG is set to true, the topic is not actually posted to the room
var DEBUG = false;

function fetchNews() {
  
  var lastUpdate = new Date(parseFloat(PropertiesService.getScriptProperties().getProperty("lastUpdate")) || 0);

  Logger.log("Last update: " + lastUpdate);
  
  Logger.log("Fetching '" + RSS_FEED_URL + "'...");
  
  var xml = UrlFetchApp.fetch(RSS_FEED_URL).getContentText();
  var document = XmlService.parse(xml);
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    
  var items = document.getRootElement().getChildren('entry', atom).reverse();
  
  Logger.log(items.length + " entrie(s) found");
  
  var count = 0;
  
  for (var i = 0; i < items.length; i++) {
    var pubDate = new Date(items[i].getChild('updated', atom).getText());
    var title = items[i].getChild("title", atom).getText();
    var content = items[i].getChild("content", atom).getText().replace(/<[^>]+>/g, "");
    var link = items[i].getChild("link", atom).getAttribute('href').getValue();
    
    if(DEBUG){
      Logger.log("------ " + (i+1) + "/" + items.length + " ------");
      Logger.log(pubDate);
      Logger.log(title);
      Logger.log(link);
      // Logger.log(description);
      Logger.log("--------------------");
    }
    

    if(pubDate.getTime() > lastUpdate.getTime()) {
      Logger.log("Posting topic '"+ title +"'...");
      if(!DEBUG){
        postTopic_(title, content, link);
      }
      PropertiesService.getScriptProperties().setProperty("lastUpdate", pubDate.getTime());
      count++;
    }
  }
  
  Logger.log("> " + count + " new(s) posted");
}

function postTopic_(title, description, link) {
  
  var text = "*" + title + "*" + "\n";
  
  if (description){
    text += description + "\n";
  }
  text += "Link: " + link + "\n"
  
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify({
      "text": text 
    })
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
