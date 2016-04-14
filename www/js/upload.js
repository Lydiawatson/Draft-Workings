"use strict";
//create a reference to the database
var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
//create a geoFire reference
var geoFireRef = new GeoFire(firebaseRef.child("locations"));

//declare a variable for the map
var map;

//declare variables for the entered marker and the marker's position
var marker;
var markerPos;
var geocoder;

//var to determine whether marker location has been confirmed
var confirmed = false;
//variables to reference the heading and confirm button in the HTML
var topInstruction = document.getElementById('uploadHeading');
var confirmLocation = document.getElementById('confirmButton');

function endUpload() {
    window.open("index.html", "_self");
}
//???could do this without declaring the variable - it is not used ANYWHERE ELSE
var cancelUpload = document.getElementById("uploadCancel");
cancelUpload.onclick = endUpload;

//function to open the map
function initMap() {
//  set up the map and give it an fallback center position
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -36.8436, lng: 174.7669},
        zoom: 15,
//        disable default controls and properties of the map
//        ???consider disabling all default controls and then enabling what you want (currently none) - might be more efficient?
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: false,
//        zoomControlOptions: {
//            position: google.maps.ControlPosition.TOP_LEFT
//        }
        disableDoubleClickZoom: true
//        ???check with others about turning off POIs
//        styles: [{featureType: "poi", elementType: "labels", stylers: [{visibility: "off"}]}]
    });
    
//    if geolocation is working change the center of the map to the user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            map.setCenter(initialLocation);
        });
    }
    
    marker = new google.maps.Marker({});
//    listener that adds a marker to the marker variable
    map.addListener('click', function (e) {
        if (!confirmed) {
//            markerPos = {lat: e.latLng.lat(), lng: e.latLng.lng()};
            marker.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()});
            marker.setMap(map);
            marker.setDraggable(true);
            topInstruction.innerHTML = "Confirm the marker position or modify";
            confirmLocation.style.display = "block";
            markerPos = marker.position;
//            console.log(marker.position);
//            console.log(marker.position.lat());
            findAddress();
        }
        
    });
    marker.addListener('dragend',function(event) {
        alert("seven potatoes");
                markerPos = marker.position;
        findAddress();
//            console.log(markerPos);
    });

}


var UplWindow = document.getElementById('popUpUpload');

function findAddress() {
//    alert("potato");
//    alert(markerPos.lat + "   " +  markerPos.lng);
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({'location': markerPos}, function (results, status) {
        
//        gives full address:
        
        if (status === google.maps.GeocoderStatus.OK) {
            document.getElementById("address").innerHTML = results[0].formatted_address;
        } //consider having error messages here but otherwise nah
        
        

    });
}

function detailsForm() {
    UplWindow.style.display = "block";
    topInstruction.innerHTML = "Now enter the details...";
    confirmed = true;
    marker.setDraggable(false);
    map.setOptions({draggable: false});
    
    
    
}
confirmLocation.onclick = detailsForm;


function unConfirmLocation() {
    confirmed = false;
    //changing top instructions is only valid until user clicks somewhere else on the map, then it reverts to "confirm the marker position when done". Issue or no??
    topInstruction.innerHTML = "Reconfirm your marker position";
    marker.setDraggable(true);
    map.setOptions({draggable: true});
    UplWindow.style.display = "none";
    
}
//could do this without declaring the variable - it is not used ANYWHERE ELSE
var cancelDetails = document.getElementById("detailsCancel");
cancelDetails.onclick = unConfirmLocation;


function confirmAll() {
    //create an empty object to put the filter information into
    var looFilters = {};
    //array containing the property categories for each filter
    var properties = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab', 'wheelchair'];
    //array that holds the checkboxes and links to them in the HTML
    var values = ['maleUpload', 'femaleUpload', 'uniUpload', 'maleBabyUpload', 'femBabyUpload', 'uniBabyUpload', 'wheelchairUpload'];
    //assign the filters to the looFilters object
    for (var i = 0; i < properties.length; i++) {
        values[i] = document.getElementById(values[i]);
        looFilters[properties[i]] = values[i].checked
    }
    //add everything to firebase
//    firebaseRef.push(
//        {location: markerPos, filters: looFilters},
//        function(error) {
//            if (error) {
//                alert('There has been some kind of dreadful problem.' + error);
//            } else {
//                alert('Your new Loocation has been saved successfully! Thank you for your contribution :)');
//                endUpload();
//            }
//        }
//    );
    

//    add everything to firebase using geofire for the location
//    var filtersWorked = null;
    
//    var newUpload = firebaseRef.child("filters").push({filters: looFilters}).then(function() {
//        geoFireRef.set(newUpload.key(), [markerPos.lat, markerPos.lng], function(error) {
//            if (error) {
//                alert('Unfortunately the location has not saved');
//            }
//        });
//        alert("Your new Loocation has been saved successfully. Thank you for your contribution.");
//        endUpload();
//    }, function(error) {
//            alert("Error: " + error);
//        });
//                
//    }


        geoFireRef.set(
            firebaseRef.child("filters").push({looFilters}).key(), 
            [markerPos.lat(), markerPos.lng()]).then(function() {
            alert("Your new Loocation has been saved successfully. Thank you for your contribution.");
            endUpload();
        }, function(error) {
            
                alert('Unfortunately the location has not saved');
            
                
            });
        }

        
    

                
    
        
//        
//        function(error) {
//            if (error) {
//                alert('There has been some kind of dreadful problem.' + error);
//            } else {
//                filtersWorked = true;
//                
//            }
//        }
//    );
//    
//    geoFireRef.set(newUpload.key(), [markerPos.lat, markerPos.lng]).then(function() {
//        if (filtersWorked) {
//  alert("Your new Loocation has been saved successfully. Thank you for your contribution.");
//        endUpload();
//        }
//}, function(error) {
//  console.log("Error: " + error);
//});
//    
//   newUpload.key();
    
    
    
    

//could do this without declaring the variable - it is not used ANYWHERE ELSE
var confirmUpload = document.getElementById('doneUpload');
confirmUpload.onclick = confirmAll;


