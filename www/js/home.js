/**/var map;
/**/var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
/**/var geoFireRef = new GeoFire(firebaseRef.child("locations"));

//var marker;

/**/var looArray = [];
var checkValues;
/**/var geoQuery = geoFireRef.query({
        center: [-36.8436, 174.7669],
        radius: 10.5
    });
var currentKey;
var infoValues;
var originalPos;


var changeAddressEntered = false;

var changingMarker;
var newMarkerPos;


var newLat;
var newLng;

var genderPrefs = [];
var babyPrefs = [];
var accessPrefs = null;


var filtWindow = document.getElementById("popUpFilter");




document.getElementById('filterCancel').onclick = closeFilters;

document.getElementById('uploadButton').onclick = uploadPage;
document.getElementById('creditsButton').onclick = openCredits;
document.getElementById("filterButton").onclick = getFilters;



var editButton = document.getElementById('filterEdit');
var doneButton = document.getElementById('doneEdit');
var editing;
editButton.onclick =  determineEditFunction;
doneButton.onclick = saveEdit;
document.getElementById('infoCancel').onclick = closeInfo;


//functions for the basic loading and filtering of the page

//function to load the map
/*run by callback in HTML*/
/*uses map*/
/*calls loadData*/
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
/*run by initMap*/
/*uses looAray, map, geoQuery*/
/*calls getInfo and filterLoo*/
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
/*run by loadData and filterAll*/
/*uses firebaseRef, genderPrefs, babyPrefs, accessPrefs*/
/*calls nothing*/
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
            marker.addListener("click", function() {getInfo(values, marker, key);})
        } else {
            //remove the loo from the map
            marker.setMap(null);
        }
        
        //when the marker is clicked, run the getInfo function
        
    });
}


//runs a loop that executes the filterLoo function for every loo in the array
/*run by closeFilters*/
/*uses nothing*/
/*calls filterLoo*/
function filterAll() {
    for (var i = 0; i < looArray.length; i++) {
        filterLoo(looArray[i].key, looArray[i].marker);
    }
}
    


//opens the filter dialog box and stops the moving of the map    
/*run when button is clicked*/
/*uses filtWindow and map*/
/*calls nothing*/
function getFilters() {
    filtWindow.style.display = 'block';
    map.setOptions({draggable: false});
}

//update/set the user's filter preferences and close the filter window
/*run when cancel button is clicked*/
/*uses map, filtWindow*/
/*calls filterAll*/
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
/*runs when button is clicked*/
/*uses nothing*/
/*calls nothing*/
function uploadPage() {
    window.open("upload.html", "_self");
}

//function that will eventually dictate what happens when the credits button is clicked
function openCredits() {
    alert('heart has been clicked');
}






//opens an infoWindow displaying relevant information about the selected loo
/*run when marker is clicked due to event listener in filterloo*/
/*uses checkValues, infoValues, map */
/*calls getAddress*/
function getInfo(values, currentMarker, currentKey){
    //ids for each checkbox in the HTML
    checkValues = ['maleInfo', 'femaleInfo', 'uniInfo', 'maleBabyInfo', 'femBabyInfo', 'uniBabyInfo', 'wheelchairInfo'];
    //corresponding values of each filter as they are entered into the firebase database
    infoValues = [values.male, values.fem, values.uni, values.mBab, values.fBab, values.uBab, values.wheelchair];
    
    //finds the address of the chosen loo
    getAddress(currentMarker.position);

    //ticks checkboxes depending on the loo's amenities to display information to the user
    for (var i = 0; i < checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
        document.getElementById(checkValues[i]).disabled = true;
    }
    
    //opens the infoWindow
    document.getElementById('popUpInfo').style.display = 'block';
    map.setOptions({draggable: false});

    
}


//changes the heading of the info box to the loo's formatted address
/*run by getInfo*/
/*uses nothing */
/*calls nothing*/
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
/*run when cancel button is clicked*/
/*uses map */
/*calls nothing*/
function closeInfo() {
    document.getElementById('popUpInfo').style.display = 'none';
    map.setOptions({draggable: true});
    
//    if (editing) {
//        cancelEdit();
//        exitEditMode();
//    }
}




//runs functions for editing depending on whether user is already in edit mode
/*runs when edit button is clicked*/
/*uses editing*/
/*calls enterEditMode, cancelEdit, exitEditMode*/
function determineEditFunction(){
    //if the user is not already editing, enter edit mode
    if (editing != true) {
            enterEditMode();
    }
    else {
        //otherwise set everything back to its initial value and exit edit mode
        cancelEdit();
        exitEditMode();
    }
};


//puts the app into edit mode
/*run by determineEditFunction*/
/*uses editing, doneButton, editButton, checkValues*/
/*calls nothing*/
function enterEditMode() {
    editing = true
    
    doneButton.style.display = "block";
    editButton.src = 'img/cancelEditPencil.svg';

    //make checkboxes editable
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = false;
    }
}


//takes the app out of edit mode
/*run by determineEditFunction*/
/*uses editing, doneButton, editButton, checkValues*/
/*calls nothing*/
function exitEditMode() {
    editing = false
    
    doneButton.style.display = "none";
    editButton.src = "img/editPencil.svg";
    
    //disable checkboxes again
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = true;
    }
}

//cancels the edit and resets all information 
/*run by determineEditFunction*/
/*uses checkValues, infoValues*/
/*calls nothing*/
function cancelEdit() {
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
    }  
}

//!!!! current key

//saves the edited information
/*run when button clicked*/
/*uses currentkey, firebaseRef, loofilters,  */
/*calls filterAll,*/
function saveEdit() {
   //asess the filtering information and save them in the looFilters object
    var looFilters = {};
    var properties = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab', 'wheelchair'];
    
    for (var i = 0; i < properties.length; i++) {
        looFilters[properties[i]] = document.getElementById(checkValues[i]).checked;
    }
    
    //replace the old looFilters information in the database with the updated data
    firebaseRef.child("filters/" + currentKey + "/looFilters").set(looFilters, function(error) {
        if(error) {
            alert("Something has gone horribly wrong." + error);
        } else {
                alert("This Loocation has been successfully updated. Thank you for your contribution");   
                exitEditMode();
            }  
        });
        
    }





























function exitLocationEdit() {
    document.getElementById('popUpInfo').style.display = 'block';
    document.getElementById("cancLocationEdit").style.display = "none";
    document.getElementById("confLocationEdit").style.display = "none";
    map.setOptions({draggable: false});
    changingMarker.setDraggable(false);
//    jk
//    /*problem*/changingMarker.setMap(null);
    
}
function confirmLocationEdit() {
    //???I want these to execute asynchronously/in order: how??
    getAddress(changingMarker.position);
    newLat = changingMarker.position.lat();
    newLng = changingMarker.position.lng();
//    /*problem*/changingMarker.setMap(null);
    exitLocationEdit();
    //    jk
//    /*problem*/changingMarker.setMap(null);
//    addressChanged = true;
    
}
function cancelLocationEdit() {
    changingMarker.setPosition(originalPos);
    exitLocationEdit();
    
}
function changeAddress() {
//    var continueFunction = confirm("Do you wish to change the location of this loo?");
//    if (continueFunction) {
        if (!changeAddressEntered) {
//            alert("lol");
            changeAddressEntered = true;
            for (var i = 0; i < looArray.length; i++) {
                looArray[i].setMap(null);
            }
            var locationRef = firebaseRef.child("locations/" + currentKey + "/l");
            locationRef.on("value", function(snapshot) {
                var editLocation = snapshot.val();

                changingMarker = new google.maps.Marker({
                    position: {lat: editLocation[0], lng: editLocation[1]},
                    map: map,
                });
            });
//            alert('yellow ostrich alert');
//        }
        
        
//        edit stuff that happens anyway
        originalPos = changingMarker.position;
        document.getElementById('popUpInfo').style.display = 'none';
        document.getElementById("cancLocationEdit").style.display = "block";
        document.getElementById("confLocationEdit").style.display = "block";
        map.setOptions({draggable: true});
        changingMarker.setDraggable(true);
        
        document.getElementById("cancLocationEdit").onclick = cancelLocationEdit;
        document.getElementById("confLocationEdit").onclick = confirmLocationEdit;
        
    }
}