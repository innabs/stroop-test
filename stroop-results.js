//Function called when page loaded:
var fullResultsArr = [];

$(document).ready(function(){
  Parse.initialize("dHY3lGqXyYbhyyh1soXN1eVDf75TYsow2ooJPCBH", "0HdnMFrq8NL07AWClyFR2rQCtbJD5vv4Neyn7DPO");
 
  //get stored results from Parse:
  var Results = Parse.Object.extend("Results");
  var query = new Parse.Query(Results);
  query.limit(200);
  query.ascending("userId, trial");
  query.find({
    success: function(results) {
        console.log("Successfully retrieved " + results.length + " results.");
        for(var i=0; i<results.length; i++) {
            console.log(results[i].get("json"));
            fullResultsArr.push(results[i].get("json"));
        }

       drawTable(fullResultsArr);
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });
});