var map;
var firebaseRef = new Firebase("https://loocation.firebaseio.com/");
var geoFireRef = new GeoFire(firebaseRef.child("locations"));
var marker;
var markers = [];
var checkValues;
var geoQuery = geoFireRef.query({
        center: [-36.8436, 174.7669],
        radius: 10.5
    });
//var genderPrefs = [];
var currentKey;
var infoValues;


var editing;

var changingMarker;



function getData(genderPrefs, babyPrefs, accessPrefs) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    var onKeyEnteredRegistration = geoQuery.on("key_entered", function (key, location, distance) {
//        console.log( key +  " is at " + location);
        
        var genderHappy = null;
        var babyHappy = null;
        var accessHappy = null;
        var values;
        var filters = firebaseRef.child("filters/" + key + "/looFilters");
        
        filters.on("value", function(snapshot) {
            values = snapshot.val();
//            console.log(values);
        
        
            if (genderPrefs.length != 0) {
                for (var i=0; i<genderPrefs.length; i++) {
                    if (values[genderPrefs[i]] == true) {
                    genderHappy = true;
                    }
                }
//                console.log("meetsGender is " + genderHappy);
            } else {
                genderHappy = true;
//                console.log("meetsGender is " + genderHappy);

            }
        

            if (babyPrefs.length != 0) {

                for (var i=0; i<babyPrefs.length; i++) {
                    if (values[babyPrefs[i]] == true) {
                        babyHappy = true;
                    }
                }
//                console.log("meetsbaby is " + babyHappy);
            } else {
                babyHappy = true;
//                console.log("meetsbaby is " + babyHappy);
            }
            
        
            if (accessPrefs) {
                if (values['wheelchair']) {
                    accessHappy = true;
                }
            } else {
                accessHappy = true;
            }
            
        
            if (genderHappy == true && babyHappy == true && accessHappy == true) {
                var markerPos = {lat: location[0], lng: location[1]};
                marker = new google.maps.Marker({
                    position: markerPos,
                    map: map
                });
            
                marker.addListener('click',function() {
                    /* var checkValues = ['maleInfo', 'femaleInfo', 'uniInfo', 'maleBabyInfo', 'femBabyInfo', 'uniBabyInfo', 'wheelchairInfo'];                    */
                    checkValues = ['maleInfo', 'femaleInfo', 'uniInfo', 'maleBabyInfo', 'femBabyInfo', 'uniBabyInfo', 'wheelchairInfo'];
                    currentKey = key;
                    getAddress(markerPos);
                    console.log(values);
 
                    infoValues = [values.male, values.fem, values.uni, values.mBab, values.fBab, values.uBab, values.wheelchair];
    

                    for (var i = 0; i<checkValues.length; i++) {
                        document.getElementById(checkValues[i]).checked = infoValues[i];
                        document.getElementById(checkValues[i]).disabled = true;
                    }
              
//                    doneButton.style.display = "none";
//                    editing = false;
//                    editButton.src = "img/editPencil.svg";
    
    
                    document.getElementById('popUpInfo').style.display = 'block';
                    map.setOptions({draggable: false});
                    
                    
                    
                           
                });
            
            
                markers.push(marker);
            } 
        
//        document.getElementById("filterCancel").addEventListener("click", function() {
//            alert('hi');
//            if (genderHappy != true) {
//                marker.setMap(null);
//            }
//                closeFilters();
//        });
           
        });
    });
}






var editButton = document.getElementById('filterEdit');
editButton.onclick =  function (){
    
//    alert(editing);
    if (editing != true) {
//        var checkEdit = confirm("Do you want to edit this loo's information?");
//        if (checkEdit){
            enterEditMode();
//        }
    }
    else {
//        cancelEdit();
        cancelEdit();
        exitEditMode();
    }
//    alert("at end: " +editing)
                            };

var doneButton = document.getElementById('doneEdit')

//function editThings() {
//    enterEditMode();
//    document.getElementById("address").onclick = changeAddress;
//}




function enterEditMode() {
    editing = true
    addressChanged = false;
    changeAddressEntered = false;
    
    doneButton.style.display = "block";
    editButton.src = 'img/cancelEditPencil.svg';

    //makes check boxes editable
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = false;
    }
    
    document.getElementById("address").addEventListener("click", changeAddress);

    
}




function cancelEdit() {
    
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).checked = infoValues[i];
    }  
    
    //need to reset the address change
}


doneButton.onclick = doneEdit;

function doneEdit() {
    debugger;
   //asess the filters and change them
    var looFilters = {};
    var properties = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab', 'wheelchair'];
    
    for (var i = 0; i < properties.length; i++) {
        looFilters[properties[i]] = document.getElementById(checkValues[i]).checked;
    }
    console.log(looFilters);
    
    firebaseRef.child("filters/" + currentKey + "/looFilters").set(looFilters, function(error) {
        
        if(error) {
            alert("Something has gone horribly wrong." + error);
        } else {
            if (changeAddressEntered) {
//                alert("hi");
//                alert("lat is :" + changingMarker.position.lat() + " lng is: " + changingMarker.position.lng());
                
               
//    /*problem*/changingMarker.setMap(null);
    firebaseRef.child("locations/" + currentKey + "/l").set({
                    0: changingMarker.position.lat(),
                    1: changingMarker.position.lng()
                }, function (error) {
                    if(error) {
                        alert("Something has gone horribly wrong. " + error);
                    } else {
                        exitEditMode();
                        alert("This Loocation has been successfully updated. Thank you for your contribution");   
                        
//                        changingMarker = null;
//                        changingMarker.setMap(null);
                    }
                });
            } else {
                alert("This Loocation has been successfully updated. Thank you for your contribution");   
                exitEditMode();
            }

            
        }
            
            });
            
        
    
//    exitEditMode();
        
    }

        
    
    /*firebaseRef.child("filters/" + currentKey + "/looFilters").set(looFilters, function(error) {
        if(error) {
            alert("Something has gone horribly wrong." + error);
        } else {
            
            firebaseRef.child("locations/" + currentKey + "/l").set({
            0: newMarkerPos.lat(), 1: newMarkerPos.lng()}, function (error) {
                if(error) {
                    alert("Something has gone horrible wrong." + error);
                    closeFilters();
                } else {
                    alert("This Loocation has been successfully updated. Thank you for your contribution");
                    closeFilters();
                }
            } )
            
            
        }
        
    });
    */
//    firebaseRef.child("locations/" + currentKey)
    
    
    

   




var newMarkerPos;



/*function enterEditModes() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    
         

    var locations = firebaseRef.child("locations/" + currentKey + "/l");
    locations.on("value", function(snapshot) {
        var location = snapshot.val();
            
                 
        marker = new google.maps.Marker({
            position: {lat: location[0], lng: location[1]},
            map: map, 
            draggable: true
        });
            
        markers.push(marker);
        marker.addListener('dragend',function(event) {
            alert("seven potatoes");
            newMarkerPos = marker.position;
                    
                   
//            console.log(markerPos);
        });
    });
}*/

var originalPos;
//var addressChanged = false;
//var changingMarker;
var changeAddressEntered = false;

function changeAddress() {
//    var continueFunction = confirm("Do you wish to change the location of this loo?");
//    if (continueFunction) {
        if (!changeAddressEntered) {
//            alert("lol");
            changeAddressEntered = true;
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
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
function exitEditMode() {
    editing = false
    
    doneButton.style.display = "none";
    editButton.src = "img/editPencil.svg";
    
    for (var i = 0; i<checkValues.length; i++) {
        document.getElementById(checkValues[i]).disabled = true;
    }
//    getData(genderPrefs, babyPrefs, accessPrefs);
    
    
    
    if (changeAddressEntered) {
        debugger;
//        /*problem*/changingMarker.setMap(null);
        changingMarker = null;
//        getData(genderPrefs, babyPrefs, accessPrefs);
    }
    
    document.getElementById("address").removeEventListener("click", changeAddress);
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
var newLat;
var newLng;

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
    
function schangeAddress() {
//                console.log(markers);
    
    var continueFunction = confirm("Do you wish to change the location of this loo?");
//         var markerPos;

//    if (continueFunction) {
        var changedLocation;
        var oldMarkerPos;

            document.getElementById("cancLocationEdit").onclick = function() {
                     /*????????oldMarkerPos = [location[0], location[1]];
                changedLocation = false;
                marker.setMap(null);*/
            }
            
            
//        map.setOptions({draggable: true});
//        document.getElementById('popUpInfo').style.display = 'none';
//        document.getElementById("cancLocationEdit").style.display = "block";
//        document.getElementById("confLocationEdit").style.display = "block";
//        
        document.getElementById("confLocationEdit").onclick = function() {
            alert("your new marker position is: "  + newMarkerPos.lat() + " " + newMarkerPos.lng());
            changedLocation = true;
            getAddress(newMarkerPos);
//            document.getElementById('popUpInfo').style.display = 'block';
//            document.getElementById("cancLocationEdit").style.display = "none";
//            document.getElementById("confLocationEdit").style.display = "none";
            
            
            
        }
             
             
             
//    }
    
}
     

   

//    marker.addListener('dragend',function(event) {
//        alert("seven potatoes");
//                markerPos = marker.position;
//        findAddress();
////            console.log(markerPos);
//    });
    
//                
                
            
 
 
 
 
 
 /*
  document.getElementById("address").onclick = function() {
//                console.log(markers);
//                
                
                
                if (editing) {
                    
                    
                    
                        var continueFunction = confirm("Do you wish to change the location of this loo?");
    if (continueFunction) {
  
        map.setOptions({draggable: true});
        currentMarker.setDraggable(true);
        document.getElementById('popUpInfo').style.display = 'none';
    document.getElementById("cancLocationEdit").style.display = "block";
    document.getElementById("confLocationEdit").style.display = "block";
   }
     

   

//    marker.addListener('dragend',function(event) {
//        alert("seven potatoes");
//                markerPos = marker.position;
//        findAddress();
////            console.log(markerPos);
//    });
    
                }
                
            }*/
 
 
 
 function getAddress(markerPos) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'location': markerPos}, function (results, status) {
        
//        gives full address:
        
        if (status === google.maps.GeocoderStatus.OK) {
            document.getElementById("address").innerHTML = results[0].formatted_address;
        } //consider having error messages here but otherwise nah
    });
}
 
 
 
 

//document.getElementById("address").onclick = changeAddress;

/*function changeAddress() {
//    var continueFunction = confirm("Do you wish to change the location of this loo?");
//    if (continueFunction) {
//        
//        map.setOptions({draggable: false});
//        marker.setDraggable(true);
//        
//    }
     document.getElementById('popUpInfo').style.display = 'none';
    document.getElementById("cancLocationEdit").style.display = "block";
    document.getElementById("confLocationEdit").style.display = "block";
//    alert("24 peanuts");
     map.setOptions({draggable: true});
    marker.setDraggable(true);
//    marker.addListener('dragend',function(event) {
//        alert("seven potatoes");
//                markerPos = marker.position;
//        findAddress();
////            console.log(markerPos);
//    });
    
    
} */






//doneButton.onclick = endEdit;
//function endEdit() {
//    var looFilters = {};
//    alert("hi");
//    var updateRef = firebaseRef.child("filters/" + key);
//    
//    doneButton.style.display = 'none';
//    
//}



var cancFilter = document.getElementById('filterCancel');
cancFilter.onclick = closeFilters;


function closeInfo() {
    document.getElementById('popUpInfo').style.display = 'none';
    map.setOptions({draggable: true});
    if (editing) {
        cancelEdit();
        exitEditMode();
    }
}
var cancInfo = document.getElementById('infoCancel');
cancInfo.onclick = closeInfo;


function uploadPage() {
    window.open("upload.html", "_self");
}
var uploadLink = document.getElementById('uploadButton');
uploadLink.onclick = uploadPage;

//function that will eventually dictate what happens when the credits button is clicked
function openCredits() {
    //random stuff so that I can test the function works
    alert('heart has been clicked');
}
var credButton = document.getElementById('creditsButton');
credButton.onclick = openCredits;





function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
//        center: {lat: -36.8436, lng: 174.7669},
        center: {lat: -36.86803405818809, lng: 174.75977897644043},
        zoom: 15,
//        zoom: 1,
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
            var initialLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(initialLocation);
        });
    }
    
    
     
    // Create a draggable circle centered on the map
//    var circle = new google.maps.Circle({
//        strokeColor: "#6D3099",
//        strokeOpacity: 0.7,
//        strokeWeight: 1,
//        fillColor: "#B650FF",
//        fillOpacity: 0.35,
//        map: map,
//        center: {lat:-36.8436, lng:174.7669},
//        radius: 10.5 * 1000,
//        draggable: false
//    });
//    
    getData([], [], null)
}



var filtWindow = document.getElementById("popUpFilter");

/*function getFilters() {
    filtWindow.style.display = 'block';
    map.setOptions({draggable: false});
}
var filtButton = document.getElementById('filterButton');
filtButton.onclick = getFilters;*/

document.getElementById("filterButton").onclick = function() {
    filtWindow.style.display = 'block';
    map.setOptions({draggable: false});
}


var genderPrefs = [];
var babyPrefs = [];
var accessPrefs = null;
function closeFilters() {
    /*for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }*/
   /* var */genderPrefs = [];
    /*var*/ babyPrefs = [];

    
    var checkIds = ['maleFilter', 'femaleFilter', 'uniFilter', 'maleBabyFilter', 'femBabyFilter', 'uniBabyFilter'];
    var fireIds = ['male', 'fem', 'uni', 'mBab', 'fBab', 'uBab'];
    
    for (var i=0; i<3; i++) {
        if(document.getElementById(checkIds[i]).checked) {
            genderPrefs.push(fireIds[i]);
        }
    }
    for (var i=3; i<6; i++) {
        if(document.getElementById(checkIds[i]).checked) {
            babyPrefs.push(fireIds[i]);
        }
    }
    

    /*var*/ accessPrefs = null;
    
    if (document.getElementById("wheelchairFilter").checked) {
        accessPrefs = true;
    }
    
    
    
    getData(genderPrefs, babyPrefs, accessPrefs);
    filtWindow.style.display = 'none';
    map.setOptions({draggable: true});
}