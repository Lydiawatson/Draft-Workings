/**/var map;
/*used by saveEdit and filterLoo*/var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
/**/var geoFireRef = new GeoFire(firebaseRef.child("locations"));



/**/var looArray = [];
var checkValues;
/**/var geoQuery = geoFireRef.query({
        center: [-36.8436, 174.7669],
        radius: 10.5
    });

var infoValues;
var originalPos;


var genderPrefs = [];
var babyPrefs = [];
var accessPrefs = null;


var filtWindow = document.getElementById("popUpFilter");

//sets up variables needed for edit mode
var editButton = document.getElementById('filterEdit');
var doneButton = document.getElementById('doneEdit');
var editing;


document.getElementById('uploadButton').onclick = uploadPage;
document.getElementById('creditsButton').onclick = openCredits;
document.getElementById("filterButton").onclick = getFilters;



//functions for the basic loading and filtering of the page

//function to load the map
/*uses map*/
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -36.86803405818809, lng: 174.75977897644043},
        zoom: 15,
        //disable default controls and properties of the map
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: false,
        disableDoubleClickZoom: true
    });
    
    //if geolocation is working center the map on the user's position
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var initialLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(initialLocation);
        });
    }
    
    //retrieves locations from the database with the loadData function
    loadData();
}


//function to retrieve the locations in the database
/*uses looAray, map, geoQuery*/
function loadData() {
    //remove all markers if there are any
    for (var i = 0; i < looArray.length; i++) {
        looArray[i].marker.setMap(null);
    }
    looArray = [];
    
    //create a marker for every location in the database within the geoQuery
    geoQuery.on("key_entered", function (key, location, distance) {
        var markerPos = {lat: location[0], lng: location[1]};
        var marker = new google.maps.Marker({
            position: markerPos,
            //make sure the marker doesn't display on the map until required
            map: null
        });
        var markerObject = {
            key: key,
            marker: marker,
        }
        
        
        //add the marker and its key to an array
        looArray.push(markerObject);
        
        //run the filterLoo function, to determine whether each marker meets the user's filter preferences, and if so displays that marker
        filterLoo(key, marker);
        
    });
}



//function to assess whether a loo meets filter preferences
/*uses firebaseRef, genderPrefs, babyPrefs, accessPrefs*/
function filterLoo(key, marker) {
    //variables for whether the particular loo being evaluated meets the filters
    var genderHappy = null;
    var babyHappy = null;
    var accessHappy = null;
    
    var filters = firebaseRef.child("filters/" + key + "/looFilters");
    //retrieve the loo's filter information from the database and evaluate it
    filters.on("value", function(snapshot) {
        var values = snapshot.val();
        
        //assess whether it meets the gender preferences
        if (genderPrefs.length != 0) {
            for (var i = 0; i < genderPrefs.length; i++) {
                if (values[genderPrefs[i]]) {
                    genderHappy = true;
                }
            }
        } else {
            genderHappy = true;
        }
        
        //assess whether it meets the baby preferences
        if (babyPrefs.length != 0) {
            for (var i = 0; i < babyPrefs.length; i++) {
                if (values[babyPrefs[i]]) {
                    babyHappy = true;
                }
            }
        } else {
            babyHappy = true;
        }

        //assess whether it meets the access preferences
        if (accessPrefs) {
            if (values['wheelchair']) {
                accessHappy = true;
            }
        } else {
            accessHappy = true;
        }

        //if the loo meets all preferences put it on the map
        if (genderHappy && babyHappy && accessHappy) {
            if (marker.map == null) {
                marker.setMap(map);
            }
            //when the marker is clicked, run the getInfo function
            marker.addListener("click", function() {
                //determine the index in the array of the current markerobject
                var looIndex;
                for (var i = 0; i < looArray.length; i++) {
                    if(looArray[i].key == key) {
                        looIndex = i;
                    }
                }
                //run the getInfo function with the list of values and the item in the looArray
                getInfo(values, looArray[looIndex]);})
        } else {
            //remove the loo from the map
            marker.setMap(null);
        }
           
    });
}


//runs a loop that executes the filterLoo function for every loo in the looArray
/*uses looArray*/
function filterAll() {
    for (var i = 0; i < looArray.length; i++) {
        filterLoo(looArray[i].key, looArray[i].marker);
    }
}
    


//opens the filter dialog box and stops the moving of the map
/*uses filtWindow and map*/
function getFilters() {
    filtWindow.style.display = 'block';
    map.setOptions({draggable: false});
    document.getElementById('filterCancel').onclick = closeFilters;
}

//update/set the user's filter preferences and close the filter window
/*uses map, filtWindow*/
function closeFilters() {
    genderPrefs = [];
    babyPrefs = [];
    accessPrefs = null;

    //ids for each checkbox in the html
    var checkIds = ['maleFilter', 'femaleFilter', 'uniFilter', 'maleBabyFilter', 'femBabyFilter', 'uniBabyFilter'];
    //corresponding ids of each filter as they are entered into the firebase database
    var fireIds = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab'];
    
    //add every gender preference to the genderPrefs array
    for (var i=0; i<3; i++) {
        if(document.getElementById(checkIds[i]).checked) {
            genderPrefs.push(fireIds[i]);
        }
    }
    //add every baby preference to the babyPrefs array
    for (var i=3; i<6; i++) {
        if(document.getElementById(checkIds[i]).checked) {
            babyPrefs.push(fireIds[i]);
        }
    }
    
    //determine whether wheelchair access has been requested
    if (document.getElementById("wheelchairFilter").checked) {
        accessPrefs = true;
    }
    
    
    //filter the loos according to preferences
    filterAll();
    
    //close the filters window
    filtWindow.style.display = 'none';
    map.setOptions({draggable: true});
}

//opens the upload page
/*uses nothing*/
function uploadPage() {
    window.open("upload.html", "_self");
}

//function that will eventually dictate what happens when the credits button is clicked
function openCredits() {
    alert('heart has been clicked');
}


//opens an infoWindow displaying relevant information about the selected loo
/*uses checkValues, infoValues, map */
function getInfo(values, looObject){
    //saves the marker's initial position in a variable so that it can be used later to determine whether the marker has been moved
    var firstLatLng = looObject.marker.position;
    //sets up variables needed for edit mode
    editing = false;
    
    //ids for each checkbox in the HTML
    checkValues = ['maleInfo', 'femaleInfo', 'uniInfo', 'maleBabyInfo', 'femBabyInfo', 'uniBabyInfo', 'wheelchairInfo'];
    //corresponding values of each filter as they are entered into the firebase database
    infoValues = [values.male, values.fem, values.uni, values.mBab, values.fBab, values.uBab, values.wheelchair];
    
    //finds the address of the chosen loo
    getAddress(looObject.marker.position);

    //ticks checkboxes depending whether the properties are true or false in the database
    for (var i = 0; i < checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
        document.getElementById(checkValues[i]).disabled = true;
    }
    
    //opens the infoWindow
    document.getElementById('popUpInfo').style.display = 'block';
    map.setOptions({draggable: false});
    
    //specifies the functions to run when different elements are clicked on, and the variables they will be passed
    document.getElementById('infoCancel').onclick = function() {closeInfo(looObject, firstLatLng)};
    editButton.onclick =  function() {determineEditFunction(looObject, firstLatLng)};
}


//changes the heading of the info box to the loo's formatted address
/*uses nothing */
function getAddress(markerPos) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'location': markerPos}, function (results, status) {
        
        //gives full address:
        if (status === google.maps.GeocoderStatus.OK) {
            document.getElementById("address").innerHTML = results[0].formatted_address;
        }
    });
}


//closes the infoWindow
/*uses map */
function closeInfo(looObject, firstLatLng) {
    document.getElementById('popUpInfo').style.display = 'none';
    map.setOptions({draggable: true});
    
    //if the user is currently in edit mode, cancel their edit
    if (editing) {
        cancelEdit(looObject, firstLatLng);
        exitEditMode();
    }
}




//runs functions for editing depending on whether user is already in edit mode
/*uses editing*/
function determineEditFunction(looObject, firstLatLng){
    //if the user is not already editing, enter edit mode
    if (editing != true) {
            enterEditMode(looObject, firstLatLng);
    } else {
        //otherwise set everything back to its initial value and exit edit mode
        cancelEdit(looObject, firstLatLng);
        exitEditMode();
    }
};


//puts the app into edit mode
/*uses editing, doneButton, editButton, checkValues*/
function enterEditMode(looObject, firstLatLng) {
     //if (confirm("Do you want to edit the information?")) {
    editing = true
    
    doneButton.style.display = "block";
    editButton.src = 'img/cancelEditPencil.svg';

    //make checkboxes editable
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = false;
    }
    //specifies the functions to run when different elements are clicked on, and the variables they will be passed
    document.getElementById('address').onclick = function() {enterLocEdit(looObject)};
    doneButton.onclick = function() {saveEdit(looObject, firstLatLng)};
    //?
}


//takes the app out of edit mode
/*uses editing, doneButton, editButton, checkValues*/
function exitEditMode() {
    editing = false
    
    doneButton.style.display = "none";
    editButton.src = "img/editPencil.svg";
    
    //disable checkboxes again
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = true;
    }
    document.getElementById('address').onclick = null;
}

//cancels the edit and resets all information 
/*uses checkValues, infoValues*/
function cancelEdit(looObject, firstLatLng) {
    //sets the checkboxes back to their initial values
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
    }
    //if the looObject marker has moved, put it back in its original position
    if (looObject.marker.position != firstLatLng) {
        looObject.marker.setPosition(firstLatLng);
    }  
}

//saves the edited information
/*uses firebaseRef, loofilters,*/
function saveEdit(looObject, firstLatLng) {
   //asess the filtering information and save them in the looFilters object
    var looFilters = {};
    var properties = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab', 'wheelchair'];
    
    //saves the looFilters as true or false depending on the value of the checkboxes
    for (var i = 0; i < properties.length; i++) {
        looFilters[properties[i]] = document.getElementById(checkValues[i]).checked;
    }
    
   
    //create an object and add the data to be updated, with the paths that the data will be updated to
    var updatedData = {}
    updatedData["filters/" + looObject.key + "/looFilters"] = looFilters;
    //only add the marker location information to the updatedData object if the marker has been moved
    if (firstLatLng != looObject.marker.position) {
        updatedData["locations/" + looObject.key + "/l"] = {
            0: looObject.marker.position.lat(),
            1: looObject.marker.position.lng()
        };
    }
    //update the information in the database and give it a completion callback
    firebaseRef.update(updatedData, function (error) {
        if (error) {
            console.log("Error updating data:", error);
        }
        else {
            alert("This Loocation has been successfully updated. Thank you for helping to maintain the integrity of our data.")
            exitEditMode();
        }
    });
}

//allows the user to edit the location of the selected marker
function enterLocEdit(looObject) {
    //if (confirm("Do you want to change the location of this loo?")) {
    //remove all markers except for the edited one from the map
    for (var i = 0; i < looArray.length; i++) {
        if (looArray[i] != looObject) {
            looArray[i].marker.setMap(null);
        }
    }
    
    //make the marker and map draggable
    looObject.marker.setDraggable(true);
    map.setOptions({draggable: true});
    
    var originalPos = looObject.marker.position;
    
    //hide and display certain elements
    document.getElementById('popUpInfo').style.display = 'none';
    document.getElementById("cancLocationEdit").style.display = 'block';
    document.getElementById("confLocationEdit").style.display = 'block';
    
    //specifies the functions to run when different elements are clicked on, and the variables they will be passed
    document.getElementById('cancLocationEdit').onclick = function() {cancelLocationEdit(originalPos, looObject.marker)};
    document.getElementById('confLocationEdit').onclick = function() {confirmLocationEdit(looObject.marker)};
    
   //} 
}

//ends location edit mode
function exitLocEdit(edMarker) {
    //sets the marker back to non-draggable
    edMarker.setDraggable(false);
    map.setOptions({draggable: false});
    
    //displays all bathrooms that meet the user preferences
    filterAll();
    
    //hides and displays the necessary elements
    document.getElementById('popUpInfo').style.display = 'block';
    document.getElementById("cancLocationEdit").style.display = 'none';
    document.getElementById("confLocationEdit").style.display = 'none';
    
    
}

//returns the user to the main editing window after resetting the marker's position
function cancelLocationEdit(originalPos, edMarker) {
    edMarker.setPosition(originalPos);
    exitLocEdit(edMarker);
}


//returns the user to the main editing window, without resetting the marker's position
function confirmLocationEdit(edMarker) {
    //???I want these to execute asynchronously/in order: how??
    getAddress(edMarker.position);
    exitLocEdit(edMarker);
}


