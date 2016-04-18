
var skipInput = false;

angular.module('snakeEnvenomation.controllers', ['ionic', 'ngCordova'])

    .controller('SignInCtrl', function($scope, $state, $ionicHistory, UserService, $ionicPopup) {

        $scope.user = {}
        $scope.patient = {}
        if (skipInput) {
            $scope.user.username = "root"
            $scope.patient.id = "1234567891011"
        }

        $scope.login = function(form, user, patient) {
            if (form.$valid) {
                if (UserService.loginUser(user.username, patient.id)) {
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('record');
                } else {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Login failed!',
                        template: 'Please check your credentials!'
                    });
                }
            }
        };
    })

    .controller('RecordCtrl', function($scope, $state, $ionicHistory, $cordovaDatePicker, $parse, UserService, RecordService, $cordovaGeolocation, $timeout) {

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        var birthdate = $scope.patient.patient_birthdate ? new Date($scope.patient.patient_birthdate) : new Date()
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        $scope.age = getAge(birthdate)
        $scope.patient.patient_birthdate = birthdate.getDate() + " " + monthNames[birthdate.getMonth()] + " " + birthdate.getFullYear()
        $scope.incident = {}
        var today = new Date();
        $scope.incident.incident_date = today.getDate() + " " + monthNames[today.getMonth()] + " " + today.getFullYear()
        var minute = today.getMinutes()
        if (minute < 10)
            minute = "0" + today.getMinutes()
        $scope.incident.incident_time = today.getHours() + ":" + minute
        
        var hasData = false
        var posOptions = { timeout: 10000, enableHighAccuracy: false };
        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function(position) {
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                //alert(position.coords.latitude + " " + position.coords.longitude)
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'latLng': latlng }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var country = "";
                    if (results[0]) {
                        for (var i = 0; i < results[0].address_components.length; i++) {
                            if (results[0].address_components[i].types[0] == "sublocality_level_1" || results[0].address_components[i].types[0] == "administrative_area_level_2") {
                                angular.element(document.getElementById('incident_district')).val(results[0].address_components[i].long_name);
                            } else if (results[0].address_components[i].types[0] == "locality" || results[0].address_components[i].types[0] == "administrative_area_level_1") {
                                angular.element(document.getElementById('incident_province')).val(results[0].address_components[i].long_name);
                            }
                        }
                    }
                }
            });
            }, function(err) {
                alert("Current location cannot be retrieved")
            }
        );


        $scope.openDatePicker = function(element) {
            var date = new Date()
            if (element == 'patient.patient_birthdate' && $scope.patient.patient_birthdate) {
                date = new Date($scope.patient.patient_birthdate)
            }
            var options = {
                date: date,
                mode: 'date',
                allowOldDates: true,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function(date) {
                var dateS = date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear()
                var model = $parse(element)
                model.assign($scope, dateS)
                if (element == 'patient.patient_birthdate')
                    $scope.age = getAge(new Date($scope.patient.patient_birthdate))
            });
        }

        $scope.openTimePicker = function(element) {
            var options = {
                date: new Date(),
                mode: 'time',
                allowOldDates: true,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function(date) {
                var minute = date.getMinutes()
                if (date.getMinutes() < 10)
                    minute = "0" + date.getMinutes()
                var timeS = date.getHours() + ":" + minute
                var model = $parse(element)
                model.assign($scope, timeS)
            });
        }

        $scope.confirm = function(user, patient, incident) {
            RecordService.addRecord(incident)
            $state.go('patientPUtil');
        };
    })

    .controller('PatientPUtilCtrl', function($scope, $state, $ionicHistory, SnakeService, RecordService, $parse, $ionicPopover, $ionicPopup) {
        $scope.b_y_class = "button-dark";
        $scope.b_n_class = "button-dark";
        $scope.r_y_class = "button-dark";
        $scope.r_n_class = "button-dark";

        $scope.toggleYesSelection = function(ybuttonS, nbuttonS) {
            if ($scope[ybuttonS] == "button-dark") {
                $scope[ybuttonS] = "button-positive";
            } else {
                $scope[ybuttonS] = "button-dark";
            }
            $scope[nbuttonS] = "button-dark";
        };

        $scope.toggleNoSelection = function(nbuttonS, ybuttonS) {
            if ($scope[nbuttonS] == "button-dark") {
                $scope[nbuttonS] = "button-positive";
            } else {
                $scope[nbuttonS] = "button-dark";
            }
            $scope[ybuttonS] = "button-dark";
        };

        var snakes = SnakeService.getAllSnakes();
        $scope.snakes = snakes;
        $scope.snakeCheckbox = [];

        $scope.snakeTypeSelect = function(selectedSnake) {
            angular.forEach($scope.snakeCheckbox, function(value, key) {
                $scope.snakeCheckbox[key] = false;
            });
            $scope.snakeCheckbox[selectedSnake] = true;
        };

        $scope.openPopover = function($event, id) {
            var template = '<ion-popover-view><ion-header-bar> <h1 class="title">' + snakes[id].thaiName + '</h1> </ion-header-bar> <ion-content>' + snakes[id].info + '</ion-content></ion-popover-view>';
            $scope.popover = $ionicPopover.fromTemplate(template, {
                scope: $scope
            });
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.popover.remove();
        });

        $scope.confirm = function() {
            
            var isCheckboxSelected = false;
            var selectedSnake = 0;
            angular.forEach($scope.snakeCheckbox, function(value, key) {
                if ($scope.snakeCheckbox[key]) {
                    selectedSnake = key
                    isCheckboxSelected = true
                }
            });
            if (!isCheckboxSelected) {
                $ionicPopup.alert({
                    title: "Snake type isn't chosen!",
                    template: 'Please select one. If you are not sure about the type, select unknown (the last one)'
                });
            } else if (selectedSnake == 0 || selectedSnake == 1 || selectedSnake == 2) {
                if ($scope.b_y_class == "button-positive") { // to systemic bleeding management
                    if (selectedSnake == 0) {
                        stage = 16;
                    } else {
                        // for each snake type
                    }
                    $state.go('bloodSample', { snake: selectedSnake, stage: stage, times: 1 });
                } else if ($scope.b_n_class != "button-positive") {
                    $ionicPopup.alert({
                        title: "Systemic bleeding isn't chosen!",
                        template: 'Please tab on Yes or No button'
                    });
                } else {
                    if (selectedSnake == 0) {
                        stage = 1;
                    } else {
                        // for each snake type
                    }
                    RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    $state.go('bloodSample', { snake: selectedSnake, stage: stage, times: 1 }); // to hematotoxic snake management
                }
            } else if (selectedSnake == 7) {
                // go to unknown snake
            } else {
                if ($scope.r_y_class == "button-positive") {
                    // go to motor weakness management
                } else if ($scope.r_n_class != "button-positive") {
                    $ionicPopup.alert({
                        title: "Respiratory failure isn't chosen!",
                        template: 'Please tab on Yes or No button'
                    });
                } else {
                    // go to neurotoxic
                }
            }
        };
    })

    .controller('BloodSampleCtrl', function($scope, $state, $ionicHistory, BloodTestService, SnakeService, StageService, $parse, $ionicPopup) {

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        if (skipInput) {
            $scope.bloodTest.INR = 0.8
            $scope.bloodTest.platelets = 60000
        }

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        $scope.confirm = function(bloodTest) {
            
            // validate input
            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            var valid = true;
            angular.forEach(angular.element(document.querySelectorAll("#blood_view input")), function(value, key) {
                var element = angular.element(value)
                if ((element.attr('ng-model') == "bloodTest.INR" || element.attr('ng-model') == "bloodTest.platelets") && !angular.element(value).val()) {
                    valid = false;
                    $ionicPopup.alert({
                        title: element[0].previousElementSibling.innerHTML + " is invalid",
                        template: 'This field is required!'
                    });
                } else if (angular.element(value).val() && !decimalRegex.test(angular.element(value).val())) {
                    valid = false;
                    $ionicPopup.alert({
                        title: element[0].previousElementSibling.innerHTML + " is invalid",
                        template: 'Only decimal value is acceptable!'
                    });
                }
            });
            
            if (valid) {
                BloodTestService.addBloodTest(bloodTest);
                
                var nextStage = stage.next_yes_stage;
                var times = $state.params.times;
                if (stage.relate_to == "blood test" && !StageService.checkCondition(stage, bloodTest)) {
                    if ($state.params.times >= stage.times) {
                        nextStage = stage.next_no_stage;
                    } else {
                        nextStage = stage.stage_num // still in the same stage if test isn't completed
                        times += 1;
                    }
                }
                if (nextStage == 0) {
                    nextStage = stage.stage_num
                }
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('hmanagement', { snake: $state.params.snake, stage: nextStage, times: times });
            }
        };


    })

    .controller('HManagementCtrl', function($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, BloodTestService, SnakeService, StageService, $timeout) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();
        $scope.bloodTest = BloodTestService.getLatestBloodTest();
        
        
        
        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;
        
        $scope.navigateToBloodResultList = function() {
            $state.go('bloodResultList');
        };

        $scope.showPopup = function(type) {
            var title = ""
            var content = ""
            if (type == 0) {
                title = "Indication for antivenom"
                content = "<ul style='list-style: circle;-webkit-padding-start: 1em;'><li>Systemic bleeding (except microscopic hematuria) or</li>"
                    + "<li>Platelets< 50,000/mcL or</li>"
                    + "<li>INR > 1.20 or</li>"
                    + "<li>20-min WBCT: not clot</li></ul>"
            } else {
                title = "How to manage"
                content = "<ul style='list-style: circle;-webkit-padding-start: 1em;'><li>หากมี Systemic bleeding (except microscopic hematuria) -> go to 1.2 and consult PC</li>"
                    + "<li>หากพบมีหนังตาตกหรือกล้ามเนื้ออ่อนแรง (อาจวินิจฉัยชนิดงูผิด) -> consult PC</li>"
                    + "<li>หากพบว่าแผลบวม (อาจวินิจฉัยชนิดงูผิด) -> consult PC</li>"
                    + "<li>ปกติไม่มีความจำเป็นต้องให้ antibiotic prophylaxis, การให้ antibiotic ให้เฉพาะรายที่มีลักษณะของการติดเชื้อ</li>"
                    + "<li>หาก UA มีผล blood positive, แต่ RBC 0-1 ควรระวังภาวะ hemolysis และ DIC ควรดู slide PBS</li>"
                    + "<li>Done = เมื่อ F/U เป็น OPD case ครบ 3 ครั้ง, ให้ administer tetanus prophylaxis</li></ul>"
            }

            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                template: content,
                title: title,
                scope: $scope,
                buttons: [
                    { text: 'Close', type: 'button-positive' }
                ]
            });
        };

        if (stage.action_type == "alert") {
            $timeout(function() {
                alert(stage.action_text);
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('bloodSample', { snake: $state.params.snake, stage: stage.stage_num, times: $state.params.times });
            }, stage.frequent * 1000 * 5);
        }

    })
    
    .controller('bloodResultCtrl', function($scope, $state) {
        $scope.navigateToBloodResult = function() {
            $state.go('bloodResult');
        };
    });

function getAge(birthdate) {
    var today = new Date()
    var yeardiff = today.getFullYear() - birthdate.getFullYear()
    var monthdiff = today.getMonth() - birthdate.getMonth()
    var datediff = today.getDate() - birthdate.getDate()
    if (monthdiff < 0 || (monthdiff == 0 && datediff < 0)) {
        yeardiff--;
        if (monthdiff < 0) {
            monthdiff = (12 - birthdate.getMonth()) + today.getMonth()
            if (datediff < 0) {
                monthdiff--;
                var num_days = new Date(birthdate.getFullYear(), birthdate.getMonth() + 1, 0).getDate();
                datediff = (num_days - birthdate.getDate()) + today.getDate()
            }
        } else {
            monthdiff = 11
            if (datediff < 0) {
                var num_days = new Date(birthdate.getFullYear(), birthdate.getMonth() + 1, 0).getDate();
                datediff = (num_days - birthdate.getDate()) + today.getDate()
            }
        }
    } else if (monthdiff == 1 && datediff < 0) {
        monthdiff = 0
        var num_days = new Date(birthdate.getFullYear(), birthdate.getMonth() + 1, 0).getDate();
        datediff = (num_days - birthdate.getDate()) + today.getDate()
    }
    return yeardiff + " ปี " + monthdiff + " เดือน " + datediff + " วัน";
}
