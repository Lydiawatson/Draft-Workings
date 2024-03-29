/**/var map;
/*used by saveEdit and filterLoo*/var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
/**/var geoFireRef = new GeoFire(firebaseRef.child("locations"));
var meMarker;

/**/var looArray = [];
var checkValues;
/**/var geoQuery = geoFireRef.query({
        center: [-36.8436, 174.7669],
        radius: 10.5
    });

var infoValues;
var originalPos;



var filtWindow = document.getElementById("popUpFilter");
var doneButton = document.getElementById('doneInfo');

//sets up variables needed for edit mode
var editButton = document.getElementById('filterEdit');
var editing;

document.getElementById('uploadButton').onclick = uploadPage;
document.getElementById('creditsButton').onclick = openCredits;
document.getElementById("filterButton").onclick = openFilters;



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
    
    meMarker = new google.maps.Marker ({
        map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                strokeWeight: 2,
                strokeColor: 'black',
                fillOpacity: 1,
                fillColor: '#00CCCC'
            }
    });
    
    //if geolocation is working center the map on the user's position
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var initialLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(initialLocation);
            meMarker.setPosition(initialLocation);
        });
//        navigator.geolocation.watchPosition(showPosition);
    }
    
    function showPosition(position) {
        var posNow = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        meMarker.setPosition(posNow);
    }
    
    
    
    //retrieves locations from the database with the loadData function
    loadData();
    
    document.getElementById('searchButton').onclick = function() {
        if (document.getElementById('searchButton').className == 'screenIcon') {
            endSearch();
        } else {
            search();
        }
    };
}

 
function search() {
    console.log('yo');
    document.getElementById('searchButton').style.display = 'none';
    var input = document.getElementById('searchIndex');
    document.getElementById('searchDiv').style.display = 'inline-block';
    document.getElementById('backArrow').style.display = 'inline-block';
    document.getElementById('filterButton').style.display = 'none';
    document.getElementById('uploadButton').style.display = 'none';
    document.getElementById('backArrow').onclick = endSearch;
    
    
    var autocomplete = new google.maps.places.Autocomplete(input);
    var timer = null;
    input.onkeydown = function() {
        clearTimeout(timer);
        console.log(timer);
    };
    
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace().geometry.location;
        map.setCenter(place);
        meMarker.setPosition(place);
        timer = setTimeout(endSearch, 6000)
    })
    
}

function endSearch() {
    document.getElementById('searchDiv').style.display = 'none';
    document.getElementById('searchButton').style.display = 'inline-block';
    document.getElementById('backArrow').style.display = 'none';
    
    document.getElementById('filterButton').style.display = 'inline-block';
    document.getElementById('uploadButton').style.display = 'inline-block';
    
}


//function to retrieve the locations in the database
/*uses looAray, map, geoQuery*/
function loadData() {
    //remove all markers if there are any
    for (var i = 0; i < looArray.length; i++) {
        looArray[i].marker.setMap(null);
    }
    looArray = [];
    
    //get the user's preferences saved in the localStorage and store them in variables.
    var allPrefs = getPrefs();
    var genderPrefs = allPrefs.genderPrefs;
    var babyPrefs = allPrefs.babyPrefs;
    var accessPrefs = allPrefs.accessPrefs;
    
    //set cog icon depending on whether any filters are active
    if (genderPrefs.length != 0 || babyPrefs.length != 0 || accessPrefs != null) {
        document.getElementById("cog").src = "img/cogTick.svg";
    } else {
        document.getElementById("cog").src = "img/cogInitial.svg";
    }
    
    //ticks filter checkboxes if they are in the preferences
    //see other method of doing this in notes
    for (var i = 0; i < genderPrefs.length; i++) {
        document.getElementById(genderPrefs[i]).checked = true;
    }
    for (var i = 0; i < babyPrefs.length; i++) {
        document.getElementById(babyPrefs[i]).checked = true;
    }
    if (accessPrefs) {
        document.getElementById("wheelchair").checked = true;
    }
    
    
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
        filterLoo(key, marker, genderPrefs, babyPrefs, accessPrefs);
        
    });
}

//function which returns saved preferences from the local storage
function getPrefs() {
    //set default values of none for all preferences
    var genderPrefs = [];
    var babyPrefs = [];
    var accessPrefs = null;
    
    //set the preferences to the values stored in the local storage provided there is data there
    if(typeof(Storage) !== "undefined" && localStorage.getItem('genderPrefs') != null) {
        genderPrefs = JSON.parse(localStorage.getItem('genderPrefs'));
        babyPrefs = JSON.parse(localStorage.getItem('babyPrefs'));
        accessPrefs = JSON.parse(localStorage.getItem('accessPrefs'));
    }    
    return {
        genderPrefs: genderPrefs,
        babyPrefs: babyPrefs,
        accessPrefs: accessPrefs
    };
    
}


//function to assess whether a loo meets filter preferences
/*uses firebaseRef, genderPrefs, babyPrefs, accessPrefs*/
function filterLoo(key, marker, genderPrefs, babyPrefs, accessPrefs) {
    //variables for whether the particular loo being evaluated meets the filters
    var genderHappy = null;
    var babyHappy = null;
    var accessHappy = null;
    
    var filters = firebaseRef.child("filters/" + key);
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
            
            //when the marker is clicked, run the openInfo function
            markerListener = marker.addListener("click", function() {
                //determine the index in the array of the current markerobject
                var looIndex;
                for (var i = 0; i < looArray.length; i++) {
                    if(looArray[i].key == key) {
                        looIndex = i;
                    }
                }
//                //finds the address of the chosen loo
                getAddress(marker.position);
                //run the openInfo function with the list of values and the item in the looArray
                openInfo(values, looArray[looIndex]);})
        } else {
            //remove the loo from the map
            marker.setMap(null);
        }
           
    });
}


//runs a loop that executes the filterLoo function for every loo in the looArray
/*uses looArray*/
function filterAll(genderPrefs, babyPrefs, accessPrefs) {
    for (var i = 0; i < looArray.length; i++) {
        filterLoo(looArray[i].key, looArray[i].marker, genderPrefs, babyPrefs, accessPrefs);
    }
}
    


//opens the filter dialog box and stops the moving of the map
/*uses filtWindow and map*/
function openFilters() {
    document.getElementById('dimmer').style.display = 'block';
    filtWindow.style.display = 'block';
    map.setOptions({draggable: false});
    document.getElementById('filterCancel').onclick = closeFilters;
}

//update/set the user's filter preferences and close the filter window
/*uses map, filtWindow*/
function closeFilters() {
    document.getElementById('dimmer').style.display = 'none';
    //clear the preferences
    var genderPrefs = [];
    var babyPrefs = [];
    var accessPrefs = null;

    
    //ids of each checkbox and the ids of the filters in firebase
    var filterIds = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab'];
    
    //add every gender preference to the genderPrefs array
    for (var i=0; i<3; i++) {
        if(document.getElementById(filterIds[i]).checked) {
            genderPrefs.push(filterIds[i]);
        }
    }
    //add every baby preference to the babyPrefs array
    for (var i=3; i<6; i++) {
        if(document.getElementById(filterIds[i]).checked) {
            babyPrefs.push(filterIds[i]);
        }
    }
    
    //determine whether wheelchair access has been requested
    if (document.getElementById("wheelchair").checked) {
        accessPrefs = true;
    }
    
    
    //filter the loos according to preferences
    filterAll(genderPrefs, babyPrefs, accessPrefs);
    
    //set cog icon depending on whether any filters are active
    if (genderPrefs.length != 0 || babyPrefs.length != 0 || accessPrefs != null) {
        document.getElementById("cog").src = "img/cogTick.svg";
    } else {
        document.getElementById("cog").src = "img/cogInitial.svg";
    }
    
    //save the preferences in local storage provided the user has access to local storage
    if(typeof(Storage) !== "undefined") {
        localStorage.setItem('genderPrefs', JSON.stringify(genderPrefs));
        localStorage.setItem('babyPrefs', JSON.stringify(babyPrefs));
        localStorage.setItem('accessPrefs', JSON.stringify(accessPrefs));
    } else {
        alert("Unfortunately your preferences are unable to be saved for future use on this phone. You will need to reenter them each time you open the app.");
    }
    
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
function openInfo(values, looObject){
    //saves the marker's initial position in a variable so that it can be used later to determine whether the marker has been moved
    var firstLatLng = looObject.marker.position;
    //sets up variables needed for edit mode
    editing = false;
    
    //ids for each checkbox in the HTML
    checkValues = ['maleInfo', 'femaleInfo', 'uniInfo', 'maleBabyInfo', 'femBabyInfo', 'uniBabyInfo', 'wheelchairInfo'];
    //corresponding values of each filter as they are entered into the firebase database
    infoValues = [values.male, values.fem, values.uni, values.mBab, values.fBab, values.uBab, values.wheelchair];
    
    

    //ticks checkboxes depending whether the properties are true or false in the database
    for (var i = 0; i < checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
        document.getElementById(checkValues[i]).disabled = true;
    }
    
    //opens the infoWindow
    document.getElementById('popUpInfo').style.display = 'block';
    document.getElementById('dimmer').style.display = 'block';
    map.setOptions({draggable: false});
    
    //specifies the functions to run when different elements are clicked on, and the variables they will be passed
    document.getElementById('infoCancel').onclick = function() {closeInfo(looObject, firstLatLng)};
    editButton.onclick =  function() {determineEditFunction(looObject, firstLatLng)};
//    doneButton.onclick = function() {giveDirections(looObject)};
    doneButton.onclick = function() {
        if(meMarker.position == undefined || meMarker.position == null) {
            alert('Your geolocation is not working and there is no place selected as your starting point. Please use the search function to select your starting position before asking for directions')
        } else {
        giveDirections(looObject);
        }
    }
}


//changes the heading of the info box to the loo's formatted address
/*uses nothing */
function getAddress(markerPos) {
    //find the address using google's Geocoder service
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'location': markerPos}, function (results, status) {
        //gives full address:
        if (status === google.maps.GeocoderStatus.OK) {
            //changes the pop-up window's content so that it displays the address
            console.log('hi');
            document.getElementById("address").innerHTML = results[0].formatted_address;
        }
    });
}

//gives directions to the selected loo
function giveDirections(looObject) {
    document.getElementById('popUpInfo').style.display = 'none';
    document.getElementById('dimmer').style.display = 'none';
    map.setOptions({draggable: true});
    document.getElementById('cancLocationEdit').innerHTML = 'Finished!';
    document.getElementById("cancLocationEdit").onclick = function() {endDirections(directionsDisplay)};
    document.getElementById("cancLocationEdit").style.display = 'block';
    markerListener = null;
        
    var directsRequest = {
        origin: meMarker.position,
        destination: looObject.marker.getPosition(),
        //waypoints
        provideRouteAlternatives: true,
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: true
    }
    
    //variable that references google's directions services
    var directionsService = new google.maps.DirectionsService();
    
    var directionsOptions = {
        map: map, 
//        draggable: true,
        suppressMarkers: true,
        suppressInfoWindows: true,
        polylineOptions : {
            map: map, 
            strokeColor: "#00CCCC",
            strokeWeight: 6,
            strokeOpacity: 0.8
        }
    }
    
    //variable to keep the renderer of directions in
    var directionsDisplay = new google.maps.DirectionsRenderer(directionsOptions);
    
//    directionsDisplay.setMap(map);
    
    directionsService.route(directsRequest, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
//            googe.maps.Polyline.getPath().push(looObject.marker.getPosition());
            console.log(result.getPath())
        }
    });
}

function endDirections(directionsDisplay) {
    console.log('beep beep');
    //???open pop up again or nah?
    document.getElementById('popUpInfo').style.display = 'block';
    document.getElementById('dimmer').style.display = 'block';
    map.setOptions({draggable: false});
    document.getElementById('cancLocationEdit').style.display = 'none';
    directionsDisplay.setMap(null);
    directionsDisplay = null;
    document.getElementById('cancLocationEdit').innerHTML = 'Cancel';
    
    
}

//closes the infoWindow
/*uses map */
function closeInfo(looObject, firstLatLng) {
    document.getElementById('popUpInfo').style.display = 'none';
    map.setOptions({draggable: true});
    document.getElementById('dimmer').style.display = 'none';
    
    //if the user is currently in edit mode, cancel their edit
    if (editing) {
        cancelEdit(looObject, firstLatLng);
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
    }
};


//puts the app into edit mode
/*uses editing, doneButton, editButton, checkValues*/
function enterEditMode(looObject, firstLatLng) {
     //if (confirm("Do you want to edit the information?")) {
    editing = true
    
    doneButton.innerHTML = "Done";
    editButton.src = 'img/cancelEditPencil.svg';
    document.getElementById('address').innerHTML = "Tap here to change marker location"
    document.getElementById('address').style.color = 'black';

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
function exitEditMode(looObject) {
    editing = false
    console.log('exiteditmode');
    
    doneButton.innerHTML = "Loocate!";
    editButton.src = "img/editPencil.svg";
    
    //disable checkboxes again
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = true;
    }
    
    getAddress(looObject.marker.position);
    
    document.getElementById('address').style.color = 'white';
    
    document.getElementById('address').onclick = null;
    doneButton.onclick = function() {
        if(meMarker.position == undefined || meMarker.position == null) {
            alert('Your geolocation is not working and there is no place selected for starting point. Please use the search function to select your starting position before asking for directions')
        } else {
        giveDirections(looObject);
        }
    }
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
    
    exitEditMode(looObject);
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
    updatedData["filters/" + looObject.key] = looFilters;
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
            exitEditMode(looObject);
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
    document.getElementById('dimmer').style.display = 'none';
    document.getElementById("cancLocationEdit").style.display = 'block';
    document.getElementById("confLocationEdit").style.display = 'block';
    
    //specifies the functions to run when different elements are clicked on, and the variables they will be passed
    document.getElementById('cancLocationEdit').onclick = function() {cancelLocationEdit(originalPos, looObject.marker)};
    //returns the user to the main editing window, without resetting the marker's position
    document.getElementById('confLocationEdit').onclick = function() {exitLocEdit(looObject.marker)};
    
   //} 
}

//ends location edit mode
function exitLocEdit(edMarker) {
    //sets the marker back to non-draggable
    edMarker.setDraggable(false);
    map.setOptions({draggable: false});
    
    //gets the user preferences
    var allPrefs = getPrefs();
    
    //displays all bathrooms that meet the user preferences
    filterAll(allPrefs.genderPrefs, allPrefs.babyPrefs, allPrefs.accessPrefs);
    
    //hides and displays the necessary elements
    document.getElementById('popUpInfo').style.display = 'block';
    document.getElementById('dimmer').style.display = 'block';
    document.getElementById("cancLocationEdit").style.display = 'none';
    document.getElementById("confLocationEdit").style.display = 'none';
    
    
}

//returns the user to the main editing window after resetting the marker's position
function cancelLocationEdit(originalPos, edMarker) {
    edMarker.setPosition(originalPos);
    exitLocEdit(edMarker);
}


