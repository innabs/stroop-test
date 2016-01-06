var COLUMNS = ["userId","age","education","trial","color","word","response", "RT"];

function drawTable(data) {
    $("#resultsDataTable tbody").remove();
    for (var i = 0; i < data.length; i++) {
        drawRow(data[i]);
    }
}

function drawRow(rowData) {
    var row = $("<tr />")
    $("#resultsDataTable").append(row);
    // userId  |  Age  |     Education  |  trial  |  color  |  word  |  response  |  RT
    for (var i = 0; i < COLUMNS.length; i++) {
    	row.append($("<td>" + rowData[COLUMNS[i]] + "</td>"));
    }
}


function msieversion() {
	var ua = window.navigator.userAgent; 
	var msie = ua.indexOf("MSIE "); 
	if (msie != -1 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number 
	{
		return true;
	} else { // If another browser, 
		return false;
	}
}

function columnsNames(obj) {
	var keys = [];
	//for (var p in obj) obj.hasOwnProperty(p) &&keys.push(p);
    for (var i; i< obj.length; i++){
    	keys.push(obj[i]);
    }
    return keys;
}

function convertJSONToCSVC(JSONData,fileName) {
    JSONData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;   
	
	//var fields = Object.keys(JSONData[0]);
	var csv = JSONData.map(function(row){
		return COLUMNS.map(function(fieldName){
	    	return row[fieldName];
	  });
	});
	csv.unshift(COLUMNS); // add header column
	csv = csv.join('\r\n');
	
	if (csv == "") {        
		 return false;
	}   
	
	if(msieversion()){
		var IEwindow = window.open();
		IEwindow.document.write('sep=,\r\n' + csv);
		IEwindow.document.close();
		IEwindow.document.execCommand('SaveAs', true, fileName + ".csv");
		IEwindow.close();
	} else {
	 var uri = 'data:application/csv;charset=utf-8,' + escape(csv);
		 var link = document.createElement("a");    
		 link.href = uri;
		 link.style = "visibility:hidden";
		 link.download = fileName + ".csv";
		 document.body.appendChild(link);
		 link.click();
		 document.body.removeChild(link);
	}
}

function downloadResults(statsType) {
	convertJSONToCSVC(fullResultsArr, "StroopTestResults");
}