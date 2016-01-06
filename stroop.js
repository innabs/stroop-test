/**** CONFIGURATION PARAMS ****/
// Colors pool for color and word:
// All colors in this list should be HTML colors. (http://en.wikipedia.org/wiki/Web_colors)
//TODO: 1. can configure which colors selected for each test; 2. can configure which leeter corresponds for each color
var COLORS = new Array(
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple"
);
var KEYS = [];

var totalTrials = 10;           //Set number of trials per test:
var nextTrialInterval = 1000;   //Set the time interval till next trial is displayed
/**** END CONFIGURATION PARAMS ****/

var userID = 0; //current last user ID
var trialsNo = 0;     //Current trial no
var countCorrect = 0; //correct answers
var startTime = 0;    //start time for each interval
var endTime = 0;      //end time for each interval
var resultsArr = [];  // array of raw results per test, containing: color math boolean, time interval for trial and correct answer boolean
var fullResultsArr = [];  // array of raw results per test, containing: color math boolean, time interval for trial and correct answer boolean

//Function called when page loaded:
$(document).ready(function(){
  Parse.initialize("dHY3lGqXyYbhyyh1soXN1eVDf75TYsow2ooJPCBH", "0HdnMFrq8NL07AWClyFR2rQCtbJD5vv4Neyn7DPO");

  //Map the keys array from the colors:
  KEYS = $.map(COLORS, function(val){
    return val.charAt(0);
  });  
  
  displayColorInstructions();
  
  $('#test, #results').hide();
 
  //get stored results from Parse:
  var Results = Parse.Object.extend("Results");
  var query = new Parse.Query(Results);
  query.select("userId");
  query.descending("userId");
  query.first({
    success: function(result) {
      // Do something with the returned Parse.Object values
      if(result) {
        userID = result.get("userId")
      }
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });

  $('#userAge, #userEducation').change(function(){
    if(this.val != "")
      $(this).parent().removeClass("has-error");
  });

  $('.close').click(function () {
      $(this).parent().removeClass('in');
    });
});

//Display the colors set in the instructions section, added dynamicaly per the colors pool.
function displayColorInstructions() {
  var color;
  for (var i=0; i < COLORS.length; i++) {
    color = COLORS[i];
   $("#colorOptions").append("<li>[" + color.charAt(0) + "]<span style='color:" + color + "'>" + color.slice(1) + "</span></li>");
  }
}

function validateUser() {
  var bValid = true;
  if($('#userAge').val()=="") {
    $('#userAge').parent().addClass("has-error");
    
   bValid = false;
  }

  if($('#userEducation').val()=="") {
    $('#userEducation').parent().addClass("has-error");
    
    bValid = false;
  }
  
  if (bValid) {
    $('.alert .close').click();
  } 
  return bValid;
}

//Start the test uppon clicking the "start" button:
function start() { 
  fullResultsArr = [];
  resultsArr = [];
  trialsNo = 0;
  countCorrect = 0; 
  
  if(!validateUser()) {
    $('.alert').addClass('in');
    return false;
  } else {
    $('#start, #userAge, #userEducation').attr('disabled', 'disabled');
  }

  $('.progress-bar').css('width', '0%').attr('aria-valuenow', 0); 
  $('#test').show();
  $('#results').hide();
  
  next();
}

//Function to handle the one trial in the test:
function next() {
  trialsNo++;
  $(document).on("keypress", handleKeyPress);
  startTime = new Date();
  $('.glyphicon').removeClass('glyphicon-ok glyphicon-remove');

  var colorIndex = Math.floor(COLORS.length * Math.random()); //randomly pick color for the word
  var textIndex = Math.floor(COLORS.length * Math.random());  //randomly pick the word
  
  $('#content').css('color', COLORS[colorIndex]); //set the color
  $('#content').html(COLORS[textIndex]);          //set the word
  $('#content').data('answer', KEYS[colorIndex]); //set data attribute for the corrct answer
  $('#content').data('colorMatch', colorIndex==textIndex);    //set dat attribute if color and word match (normal or interfere)
  $('#content').data('color',COLORS[colorIndex]);

  //set the progress, trial no out of total trials:
  var progress = trialsNo/totalTrials;
  $('.progress-bar').css('width', (progress*100)+'%').attr('aria-valuenow', progress); 
  $('.progress-bar').html("Trial " + trialsNo + " / " + totalTrials);
}

//Function to check user's input per trial:
//letter = key the user pressed
function checkResult(letter, index) {
  var correct = false;

  //check if key pressed is the same as correct answer:
  if($('#content').data('answer') == letter) {
    correct = true;
    countCorrect++;
  }  
  
  // Display feedback to the user:
  $('.glyphicon').addClass(correct? 'glyphicon-ok': 'glyphicon-remove').attr('aria-hidden', correct)
   
  //store trial raw results:
  //userId  |  Age  |     Education  |  trial  |  color  |  word  |  response  |  RT
  //fullResultsArr.push({"userId": userID, "age": $('#userAge').val(), "education": $('#userEducation').val(), "trial": trialsNo, "color": $('#content').data('color'), "word": $('#content').text(), "response": COLORS[index], "RT": endTime- startTime});
  fullResultsArr.push({"trial": trialsNo, "color": $('#content').data('color'), "word": $('#content').text(), "response": COLORS[index], "RT": endTime- startTime});
  
  //store trial result: (stroop(color match), time & correct)
  resultsArr.push({"colorMatch": $('#content').data('colorMatch'), "time": endTime- startTime, "correct": correct} );

  if (trialsNo < totalTrials) {
    setTimeout(next, nextTrialInterval); //advance to next trial
  } else {
    end(); //end test
  }
}

//Function to end the test
function end() {
  var stats = calculateStats();
  storeStats(stats);
  showResults(stats);

  $('#test').hide(1000);
  $('#start, #userAge, #userEducation').removeAttr('disabled');
}

//Function to calculate median of normal or interfere time:
function median(values) {
    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return Math.round((values[half-1] + values[half]) / 2.0);
}

//Function to calculate test stats: correct answers percentage, median normal and interfere times
function calculateStats() {
  var correctPercent = countCorrect/totalTrials*100; //correct answers percentage
  var timeNormal = 0, timeInterfere = 0; //medians for matching and non-matching items

  //Calculate medians for matching and non-matching items:
  var matchArr = [];
  var nonMatchArr = [];
  resultsArr.forEach(function (item, index) {
    if(item.colorMatch ) {
      matchArr.push(item.time);
    } else {
      nonMatchArr.push(item.time);
    }
  });

  if (matchArr.length>0) timeNormal = median(matchArr);
  if (nonMatchArr.length>0) timeInterfere = median(nonMatchArr);

  return {"correctPercent": correctPercent, "timeNormal": timeNormal, "timeInterfere": timeInterfere};
}

//Function to dispaly test results: correct answers percentage, median normal and interfere times
function showResults(stats) {
  //Display test stats:
  $('#results').show();
  $('#correctTrials').html(stats.correctPercent + "%");
  
  if(stats.timeNormal == 0) {
    $('#matchtime').parent().hide();
  }
  else {
    $('#matchtime').parent().show();
    $('#matchtime').html(stats.timeNormal);
  }
  
  if(stats.timeInterfere == 0) {
    $('#nonMatchtime').parent().hide();
  }
  else {
    $('#nonMatchtime').parent().show();
    $('#nonMatchtime').html(stats.timeInterfere);
  }
  
  drawTable(fullResultsArr);
}

//Function to store the test results:
function storeStats(stats) {
  userID++;

  //Parse:
  var Results = Parse.Object.extend("Results");
  var results;

  for (var i in fullResultsArr) {
  
    $.extend (fullResultsArr[i], {"userId": userID, "age": $('#userAge').val(), "education": $('#userEducation').val()} );
    results = new Results();
  
    results.save({
      userId: userID,
      trial: fullResultsArr[i].trial,
      json: fullResultsArr[i]
      },
      {
        success: function(results) {
          // Execute any logic that should take place after the object is saved.
          //console.log('New object created with objectId: ' + fullResultsArr[i].userId);
        },
        error: function(results, error) {
          // Execute any logic that should take place if the save fails.
          // error is a Parse.Error with an error code and message.
          //console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
  }
}

//Function to attach key press event to capture the letters pressed during the test:
var handleKeyPress = function(event) {
  endTime = new Date();
  var letter = String.fromCharCode(event.which);
  
  var index = $.inArray(letter, KEYS);
  if (index >-1) {
    $(document).off("keypress");
    checkResult(letter, index);
  }
}


