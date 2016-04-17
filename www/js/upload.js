//var to determine whether marker location has been confirmed
var confirmed = false;

//declare a variable for the map
var map;

//declare variables for the entered marker and the marker's position
var marker;
var markerPos;

 //variables to reference elements in the HTML
var confirmLocation = document.getElementById('confirmButton');
var uplWindow = document.getElementById('popUpUpload');
var topInstruction = document.getElementById('uploadHeading');

/*function runApp() {*/
//    "use strict";

    //run relevant functions when various elements are clicked
    document.getElementById("uploadCancel").onclick = endUpload;
    confirmLocation.onclick = detailsForm;
    document.getElementById("detailsCancel").onclick = unConfirmLocation;
    document.getElementById('doneUpload').onclick = confirmAll;
/*}*/



//function to return the user to the homepage of the app, runs when upload is cancelled or completed
/*needs nothing*/
function endUpload() {
    window.open("index.html", "_self");
}


//function to open the map
/*needs marker, map, markerPos and confirmed*/
function initMap() {
    //set up the map and give it an fallback center position
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -36.86803405818809, lng: 174.75977897644043},
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

    marker = new google.maps.Marker({});
    
    // add a listener that adds a marker to the map when it is clicked and find the marker's address
    map.addListener('click', function (e) {
        if (!confirmed) {
            marker.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()});
            marker.setMap(map);
            marker.setDraggable(true);
            topInstruction.innerHTML = "Confirm the marker position or modify";
            confirmLocation.style.display = "block";
            markerPos = marker.position;
            findAddress();
        }

    });
    
    //change the variable containing the marker's position when it is dragged and update the address
    marker.addListener('dragend', function(event) {     
        markerPos = marker.position;
        findAddress();
    });
}

//function to work out the formatted address of the marker
/*needs marker Pos and that is it*/
function findAddress() {
    //find the address using google's Geocoder service
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'location': markerPos}, function (results, status) {
        //gives full address:
        if (status === google.maps.GeocoderStatus.OK) {
            //changes the pop-up window's content so that it displays the address
            document.getElementById("address").innerHTML = results[0].formatted_address;
        }
    });
}

//function to open the pop-up window for finishing the upload
/*needs the uplWindow, topInstruction, confirmed, marker and map
could get the first two just straight from the document with getElementById*/
function detailsForm() {
    uplWindow.style.display = "block";
    topInstruction.innerHTML = "Now enter the details...";
    confirmed = true;
    marker.setDraggable(false);
    map.setOptions({draggable: false});
    
    
    
}


//function to allow the user to change the location of their marker after it has been confirmed
/*needs confirmed, topInstruction, marker, map and upload window*/
function unConfirmLocation() {
    confirmed = false;
    //changes top instruction telling the user to reconfirm the marker position
    topInstruction.innerHTML = "Reconfirm your marker position";
    //allows the user to move the marker and map again
    marker.setDraggable(true);
    map.setOptions({draggable: true});
    uplWindow.style.display = "none";
}

//function to save all of the information as a new entry in the database
/*needs geoFireRef, firebaseRef, markerPos*/
function confirmAll() {
    // create references to the firebase database and to geofire
    var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
    var geoFireRef = new GeoFire(firebaseRef.child("locations"));
    
    //create an empty object to put the filter information into
    var looFilters = {};
    //array containing the property categories for each filter as they will be saved in the database
    var properties = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab', 'wheelchair'];
    //array that holds the checkboxes and links to them in the HTML
    var values = ['maleUpload', 'femaleUpload', 'uniUpload', 'maleBabyUpload', 'femBabyUpload', 'uniBabyUpload', 'wheelchairUpload'];
    //assign the filters to the looFilters object, declaring them either true or false depending on the user's input
    for (var i = 0; i < properties.length; i++) {
        values[i] = document.getElementById(values[i]);
        looFilters[properties[i]] = values[i].checked
    }
    //upload the filter information to firebase under the filters child using a unique key generated by Firebase, then add the marker location using geoFire with the same key
    geoFireRef.set(firebaseRef.child("filters").push({looFilters}).key(), [markerPos.lat(), markerPos.lng()]).then(function() {
            alert("Your new Loocation has been saved successfully. Thank you for your contribution.");
            endUpload();
        }, function(error) {
            alert('Unfortunately the location has not saved');   
        });
}

        
    




