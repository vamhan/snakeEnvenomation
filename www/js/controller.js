
var skipInput = true;
var divide = 720;
//var divide = 3600;
//var divide = 1;
var sDevide = 12;

angular.module('snakeEnvenomation.controllers', ['ionic', 'ngCordova'])

    .controller('SignInCtrl', function ($scope, $state, $ionicHistory, UserService, RecordService, SnakeService, StageService, $ionicPopup, $timeout, $rootScope) {        
        $scope.user = {}
        $scope.patient = {}
        if (skipInput) {
            $scope.user.username = "noon"
            $scope.patient.id = "1100700764035"
        }
        SnakeService.getAllSnakes();
        
        $scope.newCase = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('signin');
        }
        
        $scope.selectRecord = function (record) {
            UserService.setCurrentPatient(record.patient)
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('record', {}, {reload: true});
        }

        $scope.login = function (form, user, patient) {
            if (form.$valid) {
                UserService.loginUser(user.username, patient.id).success(function (data) {
                    RecordService.getAllActiveRecords().success(function (data) {
                        $timeout(function () {
                            $scope.activeRecords = data;
                            angular.forEach($scope.activeRecords, function(record, index) {
                                var incidentDate = new Date(record.incident_date);
                                record["dateFormat"] = dateShortFormat(incidentDate)
                            });
                        });
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });

                        scheduleCheck(RecordService, $timeout);

                        $state.go('record');
                    })
                }).error(function (data) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Please check your credentials!',
                        template: data
                    });
                });
            }
        };
        
        // listen for notification
        $rootScope.$on("$cordovaLocalNotification:trigger", function(event, notification, state) {
            var data = JSON.parse(notification.data);
            $timeout(function () {
                $scope.activeRecords
            });
            var alertPopup = $ionicPopup.alert({
                title: notification.title,
                template: "<b>" + notification.text + "</b><br>" +
                    data.patient.patient_name + "<br>" +
                    data.incident_date + " " + data.incident_time + "<br>" + 
                    data.snake.snake_thai_name
            });
        });
        
        $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
            var data = JSON.parse(notification.data);
            UserService.setCurrentPatient(data.patient);
            RecordService.getRecordOfPatient();
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('record', {}, {reload: true});
        })
    })

    .controller('RecordCtrl', function ($scope, $state, $ionicHistory, $cordovaDatePicker, UserService, RecordService, $cordovaGeolocation, $timeout, $ionicPopup) {
        
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.patient.patient_gender = !UserService.getPatientInfo().patient_gender ? "Male" : UserService.getPatientInfo().patient_gender
        //var birthdate = $scope.patient.patient_birthdate ? new Date($scope.patient.patient_birthdate) : new Date()
        //$scope.age = getAge(birthdate)
        //$scope.patient.patient_birthdate = dateLongFormat(birthdate)
        
        $scope.incident = {}
        var record = RecordService.getRecordOfPatient();
        var incidentDate = new Date();
        var incidentTime = new Date();
        if (record.incident_date) {
            incidentDate = new Date(record.incident_date);
            incidentTime.setHours(record.incident_time.split(":")[0])
            incidentTime.setMinutes(record.incident_time.split(":")[1])
            $scope.incident.incident_date = dateLongFormat(incidentDate);
            $scope.incident.incident_time = record.incident_time;
            $scope.incident.incident_district = record.incident_district;
            $scope.incident.incident_province = record.incident_province;
        } else {
            $scope.incident.incident_date = dateLongFormat(incidentDate)
            $scope.incident.incident_time = timeFormat(incidentDate);

            var hasData = false
            var posOptions = { timeout: 10000, enableHighAccuracy: true };
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    //alert(position.coords.latitude + " " + position.coords.longitude)
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            var country = "";
                            if (results[0]) {
                                $timeout(function () {
                                    for (var i = 0; i < results[0].address_components.length; i++) {
                                        if (results[0].address_components[i].types[0] == "sublocality_level_1" || results[0].address_components[i].types[0] == "administrative_area_level_2") {
                                            $scope.incident.incident_district = results[0].address_components[i].long_name;
                                        } else if (results[0].address_components[i].types[0] == "locality" || results[0].address_components[i].types[0] == "administrative_area_level_1") {
                                            $scope.incident.incident_province = results[0].address_components[i].long_name;
                                        }
                                    }
                                });
                            }
                        }
                    });
                }, function (err) {
                    alert("Current location cannot be retrieved")
                });
        }

        $scope.openDatePicker = function (element) {
            /*var date;
            if (element == 'patient.patient_birthdate') {
                date = birthdate
            } else if (element == 'incident.incident_date') {
                date = incidentDate
            }*/
            var options = {
                date: incidentDate,
                mode: 'date',
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function (date) {
                var today = new Date();
                if (date.getTime() > today.getTime()) {
                    $ionicPopup.alert({
                        title: 'Invalid',
                        template: "Selected date later than today is not allow"
                    });
                } else if (date.toDateString() == today.toDateString() && 
                    (incidentTime.getHours() > today.getHours() || (incidentTime.getHours() == today.getHours() && incidentTime.getMinutes() > today.getMinutes()))) {
                    $ionicPopup.alert({
                        title: 'Invalid',
                        template: "Selected time later than today is not allow"
                    });
                } else {
                    incidentDate = date
                    $timeout(function() {
                        $scope.incident.incident_date = dateLongFormat(date)
                    });
                    /*if (element == 'patient.patient_birthdate')
                        $scope.age = getAge(new Date($scope.patient.patient_birthdate))*/
                }
            });
        }

        $scope.openTimePicker = function (element) {
            var options = {
                date: incidentTime,
                mode: 'time',
                allowOldDates: true,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function (time) {
                var today = new Date();
                if (incidentDate.toDateString() == today.toDateString() && 
                    (time.getHours() > today.getHours() || (time.getHours() == today.getHours() && time.getMinutes() > today.getMinutes()))) {
                    $ionicPopup.alert({
                        title: 'Invalid',
                        template: "Selected time later than today is not allow"
                    });
                } else {
                    incidentTime = time
                    $timeout(function() {
                        $scope.incident.incident_time = timeFormat(time)
                    });
                }
            });
        }

        $scope.confirm = function (user, patient, incident) {
            
            // validate input
            var integerRegex = /^[0-9]*$/
            var valid = true;
            if (patient.age_year && !integerRegex.test(patient.age_year)) {
                valid = false;
                $ionicPopup.alert({
                    title: "Patient age year is invalid",
                    template: 'Only number is acceptable!'
                });
            } 
            if (patient.age_month && (!integerRegex.test(patient.age_month) || patient.age_month > 11)) {
                valid = false;
                $ionicPopup.alert({
                    title: "Patient age month is invalid",
                    template: 'Only 0 - 11 is acceptable!'
                });
            } 
            if (patient.age_day && (!integerRegex.test(patient.age_day) || patient.age_day > 30)) {
                valid = false;
                $ionicPopup.alert({
                    title: "Patient age day is invalid",
                    template: 'Only 0 - 30 is acceptable!'
                });
            } 
            if (valid) {
                UserService.updateUserInfo(user);
                UserService.updatePatientInfo(patient);
                $timeout(function () {
                    $scope.activeRecords = RecordService.addRecord(incident);
                    angular.forEach($scope.activeRecords, function(record, index) {
                        var incidentDate = new Date(record.incident_date);
                        record["dateFormat"] = dateShortFormat(incidentDate)
                    });
                });
                $state.go('patientPUtil', {}, {reload: true});
            }
        };
    })

    .controller('PatientPUtilCtrl', function ($scope, $state, $ionicHistory, SnakeService, RecordService, StageService, BloodTestService, MotorWeaknessService, $ionicPopover, $ionicPopup, $timeout, $cordovaLocalNotification) {
        
        var record = RecordService.getRecord();
        $scope.b_y_class = record.systemic_bleeding ? "button-positive" : "button-dark";
        $scope.b_n_class = !record.systemic_bleeding ? "button-positive" : "button-dark";
        $scope.r_y_class = record.respiratory_failure ? "button-positive" : "button-dark";
        $scope.r_n_class = !record.respiratory_failure ? "button-positive" : "button-dark";

        $scope.toggleYesSelection = function (ybuttonS, nbuttonS) {
            if ($scope[ybuttonS] == "button-dark") {
                $scope[ybuttonS] = "button-positive";
            } else {
                $scope[ybuttonS] = "button-dark";
            }
            $scope[nbuttonS] = "button-dark";
        };

        $scope.toggleNoSelection = function (nbuttonS, ybuttonS) {
            if ($scope[nbuttonS] == "button-dark") {
                $scope[nbuttonS] = "button-positive";
            } else {
                $scope[nbuttonS] = "button-dark";
            }
            $scope[ybuttonS] = "button-dark";
        };

        SnakeService.getAllSnakes().success(function (data) {
            $timeout(function () {
                $scope.snakes = data;
            });
        });

        $scope.snakeCheckbox = [];
        $scope.snakeCheckbox[record.snake_type] = true;

        $scope.snakeTypeSelect = function (selectedSnake) {
            angular.forEach($scope.snakeCheckbox, function (value, key) {
                $scope.snakeCheckbox[key] = false;
            });
            $scope.snakeCheckbox[selectedSnake] = true;
        };

        $scope.openPopover = function ($event, id) {
            var template = '<ion-popover-view><ion-header-bar> <h1 class="title">' + $scope.snakes[id].snake_thai_name + '</h1> </ion-header-bar> <ion-content>' + $scope.snakes[id].info + '</ion-content></ion-popover-view>';
            $scope.popover = $ionicPopover.fromTemplate(template, {
                scope: $scope
            });
            $scope.popover.show($event);
        };
        $scope.closePopover = function () {
            $scope.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            if ($scope.popover) {
                $scope.popover.remove();
            }
        });

        $scope.confirm = function () {
            
            var isCheckboxSelected = false;
            var selectedSnake = 0;
            angular.forEach($scope.snakeCheckbox, function (value, key) {
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
            } else {
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $timeout(function () {
                    $scope.activeRecords
                });
                if ($scope.r_y_class == "button-positive") { // to respiratory failure management
                    StageService.getAllStagesOfSnakeType(9).success(function (stage) {
                        if (record.transaction && record.respiratory_failure) { // already start management process and if it was respiratory_failure previously
                            if (record.transaction.action) { // come back after click on notification
                                StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                                    $state.go('motorWeakness', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                });
                            } else {
                                if (record.transaction.stage.stage_num < 90) {
                                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                                        $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                    });
                                } else {
                                    $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                }
                            }
                        } else {
                            if (record.transaction && !record.respiratory_failure) {
                                // cancel previous notification
                                var previousId = parseInt((record.record_id + "").substring(4) + "" + record.transaction.stage.stage_num + "" + record.transaction.times)
                                $cordovaLocalNotification.isPresent(previousId).then(function (present) {
                                    if (present) {
                                        $cordovaLocalNotification.cancel(previousId);
                                    }
                                });
                            }
                            var nextStage;
                            switch (selectedSnake) {
                                case 3:
                                    nextStage = 91
                                    break;
                                case 4:
                                    nextStage = 93
                                    break;
                                case 5:
                                    nextStage = 95
                                    break;
                                case 6:
                                    nextStage = 97
                                    break;
                                case 7:
                                    nextStage = 99
                                    break;
                                default:
                                    // go to conflict
                                    nextStage = 36
                                    break;
                            }
                            $state.go('nmanagement', { snake: selectedSnake, stage: nextStage, times: 1 });
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if ($scope.b_y_class == "button-positive") { // to systemic bleeding management
                    StageService.getAllStagesOfSnakeType(8).success(function (stage) {
                        if (record.transaction && record.systemic_bleeding) { // already start management process and if it was systemic_bleeding previously
                            $state.go('hmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                        } else {
                            if (record.transaction && !record.systemic_bleeding) {
                                // cancel previous notification
                                var previousId = parseInt((record.record_id + "").substring(4) + "" + record.transaction.stage.stage_num + "" + record.transaction.times)
                                $cordovaLocalNotification.isPresent(previousId).then(function (present) {
                                    if (present) {
                                        $cordovaLocalNotification.cancel(previousId);
                                    }
                                });
                            }
                            var nextStage;
                            switch (selectedSnake) {
                                case 0:
                                    nextStage = 81
                                    break;
                                case 1:
                                    nextStage = 83
                                    break;
                                case 2:
                                    nextStage = 85
                                    break;
                                case 7:
                                    nextStage = 87
                                    break;
                                default:
                                    // go to conflict
                                    nextStage = 36
                                    break;
                            }
                            $state.go('hmanagement', { snake: selectedSnake, stage: nextStage, times: 1 });
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if (selectedSnake == 0 || selectedSnake == 1 || selectedSnake == 2) { // to hematotoxic snake management
                    BloodTestService.getBloodTests(); // get all previous blood tests of this record
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        if (record.transaction) { // already start management process
                            if (record.snake_type == selectedSnake) {
                                if (record.transaction.action) { // come back after click on notification
                                    $state.go('bloodSample', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                } else {
                                    $state.go('hmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                }
                            } else {
                                var snakeBefore = record.snake_type;
                                var snakeAfter = selectedSnake;
                                $ionicPopup.confirm({
                                    title: 'Selected snake type change',
                                    template: 'You have selected different snake type from previous. Are you sure you want to change the snake type?'
                                }).then(function(res) {
                                    if (res) {
                                        // cancel previous notification
                                        var previousId = parseInt((record.record_id + "").substring(4) + "" + record.transaction.stage.stage_num + "" + record.transaction.times)
                                        $cordovaLocalNotification.isPresent(previousId).then(function (present) {
                                            if (present) {
                                                $cordovaLocalNotification.cancel(previousId);
                                            }
                                        });
                                        $state.go('bloodSample', { snake: selectedSnake, stage: stage.stage_num, times: 1 }, {reload: true});
                                    } else {
                                        $timeout(function () {
                                            $scope.snakeCheckbox[snakeAfter] = false;
                                            $scope.snakeCheckbox[snakeBefore] = true;
                                            RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", snakeBefore)
                                        });
                                    }
                                });
                            }
                        } else {
                            $state.go('bloodSample', { snake: selectedSnake, stage: stage.stage_num, times: 1 }, {reload: true});
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if (selectedSnake == 3 || selectedSnake == 4 || selectedSnake == 5 || selectedSnake == 6) { // to neurotoxic snake management
                    MotorWeaknessService.getMotorWeaknesses();
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        if (record.transaction) { // already start management process
                            if (record.snake_type == selectedSnake) {
                                if (record.transaction.action) { // come back after click on notification
                                    $state.go('motorWeakness', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                } else {
                                    $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                }
                            } else {
                                var snakeBefore = record.snake_type;
                                var snakeAfter = selectedSnake;
                                $ionicPopup.confirm({
                                    title: 'Selected snake type change',
                                    template: 'You have selected different snake type from previous. Are you sure you want to change the snake type?'
                                }).then(function(res) {
                                    if (res) {
                                        // cancel previous notification
                                        var previousId = parseInt((record.record_id + "").substring(4) + "" + record.transaction.stage.stage_num + "" + record.transaction.times)
                                        $cordovaLocalNotification.isPresent(previousId).then(function (present) {
                                            if (present) {
                                                $cordovaLocalNotification.cancel(previousId);
                                            }
                                        });
                                        $state.go('motorWeakness', { snake: selectedSnake, stage: stage.stage_num, times: 0 });
                                    } else {
                                        $timeout(function () {
                                            $scope.snakeCheckbox[snakeAfter] = false;
                                            $scope.snakeCheckbox[snakeBefore] = true;
                                            RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", snakeBefore)
                                        });
                                    }
                                });
                            }
                        } else {
                            $state.go('motorWeakness', { snake: selectedSnake, stage: stage.stage_num, times: 0 });
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else { // to unknown snake management
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        if (record.transaction) { // already start management process
                            if (record.snake_type == 7) {
                                if (record.transaction.action) { // come back after click on notification
                                    $state.go('unknownTest', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                } else {
                                    $state.go('umanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                                }
                            } else {
                                var snakeBefore = record.snake_type;
                                var snakeAfter = selectedSnake;
                                $ionicPopup.confirm({
                                    title: 'Selected snake type change',
                                    template: 'You have selected different snake type from previous. Are you sure you want to change the snake type?'
                                }).then(function(res) {
                                    if (res) {
                                        // cancel previous notification
                                        var previousId = parseInt((record.record_id + "").substring(4) + "" + record.transaction.stage.stage_num + "" + record.transaction.times)
                                        $cordovaLocalNotification.isPresent(previousId).then(function (present) {
                                            if (present) {
                                                $cordovaLocalNotification.cancel(previousId);
                                            }
                                        });
                                        $state.go('unknownTest', { snake: selectedSnake, stage: stage.stage_num, times: 0 }, {reload: true});
                                    } else {
                                        $timeout(function () {
                                            $scope.snakeCheckbox[snakeAfter] = false;
                                            $scope.snakeCheckbox[snakeBefore] = true;
                                            RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", snakeBefore)
                                        });
                                    }
                                });
                            }
                        } else {
                            $state.go('unknownTest', { snake: selectedSnake, stage: stage.stage_num, times: 0 }, {reload: true});
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                }
            }
        };
    })

    .controller('HematotoxicCtrl', function ($scope, $state, $ionicHistory, UserService, RecordService, SnakeService, StageService, $ionicPopup, $timeout, $rootScope) {        
        
        $scope.toBloodTest = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('bloodSample', { snake: selectedSnake, stage: stage.stage_num, times: 1 }, {reload: true});
        }
        
        $scope.toManagement = function (record) {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('hmanagement', { snake: $state.params.snake, stage: nextStage, times: times });
        }
    })

    .controller('BloodSampleCtrl', function ($scope, $state, $ionicHistory, BloodTestService, SnakeService, StageService, RecordService, $ionicPopup, $cordovaLocalNotification) {

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        //$scope.bloodTest.INR = 0.8
        //$scope.bloodTest.platelets = 150000

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        $scope.confirm = function (scopeBloodTest) {
            
            var bloodTest = {};
            angular.forEach(scopeBloodTest, function (value, key) {
                bloodTest[key] = value;
            });

            // validate input
            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            var valid = true;
            angular.forEach(scopeBloodTest, function (value, key) {
                if (key != "WBCT" && key != "ua_blood" && key != "RBC") {
                    bloodTest[key] = Number(value)
                    if (value && !decimalRegex.test(value)) {
                        valid = false;
                        $ionicPopup.alert({
                            title: key + " is invalid",
                            template: 'Only decimal value is acceptable!'
                        });
                    } else if (key == "INR" && !value) {
                        bloodTest.INR = 0.8
                    } else if (key == "platelets" && !value) {
                        bloodTest.platelets = 150000
                    }
                }
            });

            if (valid) {
                
                // clear previous notification
                var record = RecordService.getRecord();
                var previousId = parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times)
                /*$cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                    if (present) {
                        $cordovaLocalNotification.clear(previousId);
                    }
                });*/
            
                BloodTestService.addBloodTest(scopeBloodTest);

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, bloodTest, times);
                if (nextStage == stage.stage_num) {
                    times++;
                } else {
                    times = 1;
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

    .controller('HManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, BloodTestService, SnakeService, StageService, $cordovaLocalNotification, $timeout) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();
        $scope.bloodTest = BloodTestService.getLatestBloodTest();

        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;
        
        // close case
        if (stage.next_yes_stage == 0 && stage.next_no_stage == 0) {
            $timeout(function () {
                $scope.activeRecords = RecordService.closeCase();
            });
        }

        $scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0
        $scope.show_call = stage.action_type == 'call'

        $scope.navigateToBloodResultList = function () {
            $state.go('bloodResultList');
        };

        $scope.showPopup = function (type) {
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

        $scope.navigateToNextStage = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('hmanagement', { snake: $state.params.snake, stage: stage.next_yes_stage, times: 1 });
        };

        // schedule notification
        /*if (stage.action_type == "alert" && (!$scope.record.transaction 
            || !($scope.record.transaction.stage.stage_num == stage.stage_num && $scope.record.transaction.times == $state.params.times))) {
            var now = new Date().getTime();
            var notifTime = new Date(now + ((stage.frequent / divide) * 1000));
            var option = {
                id: parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times),
                at: notifTime,
                title: stage.relate_to.replace( /\b\w/g, function (m) {return m.toUpperCase();}),
                text: stage.action_text + "   times: " + $state.params.times + "  patient: " + UserService.getPatientInfo().patient_name,
                sound: null,
                data: RecordService.getRecord()
                //badge: 1
            };
            $cordovaLocalNotification.schedule(option).then(function () {
                alert("notification add")
            });
        }*/
        
        // log current transaction
        StageService.logTransaction(stage, $state.params.times)
        // update badge
        $timeout(function () {
            $scope.activeRecords
        });

    })

    .controller('bloodResultCtrl', function ($scope, $state, BloodTestService) {
        $scope.bloodTests = BloodTestService.getBloodTests();

        $scope.bloodTest = $scope.bloodTests[$state.params.index];

        $scope.navigateToBloodResult = function (index) {
            $state.go('bloodResult', { index: index });
        };
    })


    .controller('MotorWeaknessCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, MotorWeaknessService, RecordService, $ionicPopup, $cordovaLocalNotification) {

        $scope.r_y_class = "button-dark";
        $scope.r_n_class = "button-positive";
        $scope.m_y_class = "button-dark";
        $scope.m_n_class = "button-positive";

        $scope.toggleYesSelection = function (ybuttonS, nbuttonS) {
            if ($scope[ybuttonS] == "button-dark") {
                $scope[ybuttonS] = "button-positive";
            } else {
                $scope[ybuttonS] = "button-dark";
            }
            $scope[nbuttonS] = "button-dark";
        };

        $scope.toggleNoSelection = function (nbuttonS, ybuttonS) {
            if ($scope[nbuttonS] == "button-dark") {
                $scope[nbuttonS] = "button-positive";
            } else {
                $scope[nbuttonS] = "button-dark";
            }
            $scope[ybuttonS] = "button-dark";
        };

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        
        $scope.show_respiratory = stage.relate_to == 'respiratory' && $state.params.times > 0

        $scope.confirm = function () {

            // validate input
            var valid = true;

            if (valid) {
                
                // clear previous notification
                var record = RecordService.getRecord();
                var previousId = parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times)
                $cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                    if (present) {
                        $cordovaLocalNotification.clear(previousId);
                    }
                });
                
                var data = {};
                data["respiratory_failure"] = $scope.r_y_class == "button-positive" ? 1 : 0
                data["motor_weakness"] = $scope.m_y_class == "button-positive" ? 1 : 0

                MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0);

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, data, times);
                if (nextStage == stage.stage_num) {
                    times++;
                } else {
                    times = 1;
                }
                if (nextStage == 0) {
                    nextStage = stage.stage_num
                }
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('nmanagement', { snake: $state.params.snake, stage: nextStage, times: times });
            }
        };


    })

    .controller('NManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, StageService, MotorWeaknessService, $timeout, $cordovaLocalNotification) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();
        var latestMotorWeakness = MotorWeaknessService.getLatestMotorWeakness();
        if (latestMotorWeakness) {
            $scope.latest_weakness = MotorWeaknessService.getLatestMotorWeakness().motor_weakness == 0 ? "no" : "yes"
        }


        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;
        
        // close case
        if (stage.next_yes_stage == 0 && stage.next_no_stage == 0) {
            $timeout(function () {
                $scope.activeRecords = RecordService.closeCase();
            });
        }
        
        $scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0
        $scope.show_call = stage.action_type == 'call'

        $scope.navigateToNextStage = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            if (stage.next_yes_stage == 31 || stage.next_yes_stage == 41 || stage.next_yes_stage == 51 || stage.next_yes_stage == 61) {
                StageService.getAllStagesOfSnakeType($state.params.snake).success(function (stage) {
                    $state.go('motorWeakness', { snake: $scope.snake, stage: stage.stage_num, times: 1 });
                });
            } else {
                $state.go('nmanagement', { snake: $state.params.snake, stage: stage.next_yes_stage, times: 1 });
            }
        };

        $scope.navigateToWeaknessResultList = function () {
            $state.go('weaknessResultList');
        };

        // schedule notification
        if (stage.action_type == "alert" && (!$scope.record.transaction 
            || !($scope.record.transaction.stage.stage_num == stage.stage_num && $scope.record.transaction.times == $state.params.times))) {
            var now = new Date().getTime();
            var notifTime = new Date(now + ((stage.frequent / divide) * 1000));
            var option = {
                id: parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times),
                at: notifTime,
                title: stage.relate_to.replace( /\b\w/g, function (m) {return m.toUpperCase();}),
                text: stage.action_text + "   times: " + $state.params.times + "  patient: " + UserService.getPatientInfo().patient_name,
                sound: null,
                data: RecordService.getRecord()
                //badge: 1
            };
            $cordovaLocalNotification.schedule(option).then(function () {
                //alert("notification add")
            });
        }
        
        // log current transaction
        StageService.logTransaction(stage, $state.params.times)
        // update badge
        $timeout(function () {
            $scope.activeRecords
        });

    })

    .controller('WeaknessResultCtrl', function ($scope, $state, MotorWeaknessService) {
        $scope.motorWeaknesses = MotorWeaknessService.getMotorWeaknesses();
    })


    .controller('UnknownTestCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, RecordService, BloodTestService, MotorWeaknessService, $ionicPopup, $cordovaLocalNotification) {

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        //$scope.bloodTest.INR = 0.8
        //$scope.bloodTest.platelets = 150000

        $scope.m_y_class = "button-dark";
        $scope.m_n_class = "button-positive";
        $scope.ar_y_class = "button-dark";
        $scope.ar_n_class = "button-positive";
        $scope.le_y_class = "button-dark";
        $scope.le_n_class = "button-positive";
        $scope.in_y_class = "button-dark";
        $scope.in_n_class = "button-positive";
        $scope.j_y_class = "button-dark";
        $scope.j_n_class = "button-positive";

        $scope.toggleYesSelection = function (ybuttonS, nbuttonS) {
            if ($scope[ybuttonS] == "button-dark") {
                $scope[ybuttonS] = "button-positive";
            } else {
                $scope[ybuttonS] = "button-dark";
            }
            $scope[nbuttonS] = "button-dark";
        };

        $scope.toggleNoSelection = function (nbuttonS, ybuttonS) {
            if ($scope[nbuttonS] == "button-dark") {
                $scope[nbuttonS] = "button-positive";
            } else {
                $scope[nbuttonS] = "button-dark";
            }
            $scope[ybuttonS] = "button-dark";
        };

        $scope.show_weakness = $state.params.stage != 75
        $scope.show_unknown = $state.params.stage == 71 && $state.params.times == 0
        $scope.show_bloodtest = ($state.params.stage == 71 && $state.params.times % 6 == 0) || $state.params.stage == 75
        $scope.show_creatinine = $state.params.stage == 71 && ($state.params.times == 0 || $state.params.times == 24)


        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.confirm = function (scopeBloodTest) {
            
            var bloodTest = {};
            angular.forEach(scopeBloodTest, function (value, key) {
                bloodTest[key] = value;
            });

            // validate input
            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            var valid = true;
            angular.forEach(scopeBloodTest, function (value, key) {
                if (key != "WBCT" && key != "ua_blood" && key != "RBC") {
                    bloodTest[key] = Number(value)
                    if (value && !decimalRegex.test(value)) {
                        valid = false;
                        $ionicPopup.alert({
                            title: key + " is invalid",
                            template: 'Only decimal value is acceptable!'
                        });
                    } else if (key == "INR" && !value) {
                        bloodTest.INR = 0.8
                    } else if (key == "platelets" && !value) {
                        bloodTest.platelets = 150000
                    }
                }
            });

            var stage = StageService.getStage($state.params.stage);

            if (valid) {
                
                // clear previous notification
                var record = RecordService.getRecord();
                var previousId = parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times)
                $cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                    if (present) {
                        $cordovaLocalNotification.clear(previousId);
                    }
                });

                var record = RecordService.getRecord();
                if ($state.params.times == 0) {
                    RecordService.updateUnknownFields(
                        $scope.ar_y_class == "button-positive",
                        $scope.le_y_class == "button-positive",
                        $scope.in_y_class == "button-positive",
                        $scope.j_y_class == "button-positive")
                }

                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                /*if ($state.params.stage == 71 && $state.params.times == 0) { // first time
                    var stage = StageService.getStage(71);
                    
                    var data = {};
                    data["motor_weakness"] = $scope.m_y_class == "button-positive" ? 1 : 0
                    var nextStage = StageService.checkCondition(stage, data, 1);

                    if (nextStage == 71) {
                        var stage = StageService.getStage(72);
                        var nextStage = StageService.checkCondition(stage, bloodTest, 1);
                        if (nextStage == 72) {
                            $state.go('umanagement', { snake: $state.params.snake, stage: 71, times: 1 });
                        } else if (nextStage == 76) {
                            if (record["ar"] == 1 || record["le"] == 0) {
                                StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                                    $state.go('bloodSample', { snake: 1, stage: 1, times: 1 });
                                });
                            } else {
                                $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1 });
                            } 
                        }
                    } else { // Indentification for neurotoxic snake
                        if (record["le"] == 1 && record["jaw"] == 1) {
                            StageService.getAllStagesOfSnakeType(4).success(function (stage) {
                                $state.go('motorWeakness', { snake: 4, stage: 41, times: 1 });
                            });
                        } else if (record["le"] == 1 && record["jaw"] == 0) {
                            StageService.getAllStagesOfSnakeType(3).success(function (stage) {
                                $state.go('motorWeakness', { snake: 3, stage: 31, times: 1 });
                            });
                        } else if (record["le"] == 0 && record["indoor"] == 1) {
                            StageService.getAllStagesOfSnakeType(6).success(function (stage) {
                                $state.go('motorWeakness', { snake: 6, stage: 61, times: 1 });
                            });
                        } else if (record["le"] == 0 && record["indoor"] == 0) {
                            $state.go('umanagement', { snake: $state.params.snake, stage: 79, times: 1 });
                        } else {
                            // go to conflict state
                        }
                    }*/
                if ($state.params.stage == 71) {
                    var stage = StageService.getStage(71);
                    var time = $state.params.times;

                    var data = {};
                    data["motor_weakness"] = $scope.m_y_class == "button-positive" ? 1 : 0
                    MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0);
                    var nextStage = StageService.checkCondition(stage, data, time);

                    if (nextStage == 71) {
                        if (time % 6 == 0) { // blood test
                            BloodTestService.addBloodTest(scopeBloodTest);
                            var stage = StageService.getStage(72);
                            var nextStage = StageService.checkCondition(stage, bloodTest, time / 6);
                            if (nextStage == 72) {
                                time++;
                                $state.go('umanagement', { snake: $state.params.snake, stage: 71, times: time });
                            } else if (nextStage == 76) { // indication for hematotoxic snake
                                if (record["ar"] == 1 || record["le"] == 0) {
                                    RecordService.updateRecord(false, false, 0)
                                    StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                                        $state.go('hmanagement', { snake: 0, stage: 2, times: 1 });
                                    });
                                } else { // consult PC
                                    $state.go('umanagement', { snake: $state.params.snake, stage: 78, times: 1 });
                                }
                            } else {
                                $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1 });
                            }
                        } else {
                            time++;
                            $state.go('umanagement', { snake: $state.params.snake, stage: 71, times: time });
                        }
                    } else if (nextStage == 77) { // indication for neurotoxic snake
                        if (record["le"] == 1 && record["jaw"] == 1) {
                            RecordService.updateRecord(false, false, 4)
                            StageService.getAllStagesOfSnakeType(4).success(function (stage) {
                                $state.go('nmanagement', { snake: 4, stage: 41, times: 1 });
                            });
                        } else if (record["le"] == 1 && record["jaw"] == 0) {
                            RecordService.updateRecord(false, false, 3)
                            StageService.getAllStagesOfSnakeType(3).success(function (stage) {
                                $state.go('nmanagement', { snake: 3, stage: 31, times: 1 });
                            });
                        } else if (record["le"] == 0 && record["indoor"] == 1) {
                            RecordService.updateRecord(false, false, 6)
                            StageService.getAllStagesOfSnakeType(6).success(function (stage) {
                                $state.go('nmanagement', { snake: 6, stage: 61, times: 1 });
                            });
                        } else if (record["le"] == 0 && record["indoor"] == 0) { // consult PC
                            $state.go('umanagement', { snake: $state.params.snake, stage: 79, times: 1 });
                        } else {
                            // go to conflict state
                        }
                    } else {
                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1 });
                    }
                } else {
                    BloodTestService.addBloodTest(scopeBloodTest);

                    var times = $state.params.times;
                    var nextStage = StageService.checkCondition(stage, bloodTest, times);
                    if (nextStage == 76) { // indication for hematotoxic snake
                        if (record["ar"] == 1 || record["le"] == 0) {
                            RecordService.updateRecord(false, false, 0)
                            StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                                $state.go('hmanagement', { snake: 0, stage: 2, times: 1 });
                            });
                        } else {
                            $state.go('umanagement', { snake: $state.params.snake, stage: 78, times: 1 });
                        }
                    } else {
                        times++;
                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: times });
                    }
                }
                /*} else if ($state.params.stage == 72) { // for blood test
                    var stage = StageService.getStage(72);
                    var time = $state.params.times;
                    var nextStage = StageService.checkCondition(stage, bloodTest, time);
                    if (nextStage == 72) {
                        time++;
                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: time });
                    } else if (nextStage == 76) {
                        if (record["ar"] == 1 || record["le"] == 0) {
                            StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                                $state.go('bloodSample', { snake: 1, stage: 1, times: 1 });
                            });
                        } else {
                            $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1 });
                        } 
                    } else {
                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1 });
                    }
                }*/
            }
        };


    })

    .controller('UManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, StageService, $timeout, $cordovaLocalNotification) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();


        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;
        
        $scope.show_call = stage.action_type == 'call'
        
        // close case
        if (stage.next_yes_stage == 0 && stage.next_no_stage == 0) {
            $timeout(function () {
                $scope.activeRecords = RecordService.closeCase();
            });
        }
        
        // schedule notification
        if (stage.action_type == "alert" && (!$scope.record.transaction 
            || !($scope.record.transaction.stage.stage_num == stage.stage_num && $scope.record.transaction.times == $state.params.times))) {
            var text = stage.action_text
            if ($state.params.stage == 71) {
                if ($state.params.times % 6 == 0) {
                    text = "Observe weakness and neuro sign & CBC, PT, INR, 20 min WBCT";
                } else {
                    text = "Observe weakness and neuro sign";
                }
            }
            var now = new Date().getTime();
            var notifTime = new Date(now + ((stage.frequent / divide) * 1000));
            var option = {
                id: parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times),
                at: notifTime,
                title: stage.relate_to.replace( /\b\w/g, function (m) {return m.toUpperCase();}),
                text: text + "   times: " + $state.params.times + "  patient: " + UserService.getPatientInfo().patient_name,
                sound: null,
                data: RecordService.getRecord()
                //badge: 1
            };
            $cordovaLocalNotification.schedule(option).then(function () {
                //alert("notification add")
            });
        }
        
        // log current transaction
        StageService.logTransaction(stage, $state.params.times)
        // update badge
        $timeout(function () {
            $scope.activeRecords
        });

    })

function scheduleCheck(RecordService, timeout) {
    timeout(function() {
        checkNotification(RecordService, timeout)
    }, (60000 / sDevide));
}

function checkNotification(RecordService, timeout) {
    RecordService.getAllActiveRecords().success(function (activeRecords) {
        angular.forEach(activeRecords, function(record, index) {
            if (record.transaction && record.transaction.notification == 0) {
                var lastTransactionTime = new Date(record.transaction.datetime).getTime();
                var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                var now = new Date().getTime();
                if ((lastTransactionTime + frequent) <= now) {
                    alert(record.transaction.stage.action_text + "   times: " + (record.transaction.times + 1))
                    /*var option = {
                        id: parseInt((record.record_id + "").substring(4) + "" + stage.stage_num + "" + $state.params.times),
                        title: stage.relate_to.replace( /\b\w/g, function (m) {return m.toUpperCase();}),
                        text: stage.action_text + "   times: " + $state.params.times + "  patient: " + UserService.getPatientInfo().patient_name,
                        sound: null,
                        data: RecordService.getRecord()
                        //badge: 1
                    };
                    $cordovaLocalNotification.schedule(option).then(function () {
                        alert("notification add")
                    });*/
                }
            }
        });
        scheduleCheck(RecordService, timeout)
    })
}
    
    
function dateShortFormat(date) {
    var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var month = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    return day + "/" + month + "/" + date.getFullYear()
}

function dateLongFormat(date) {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear()
}

function timeFormat(date) {
    var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    return date.getHours() + ":" + minute
}

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
                var num_days = new Date(birthdate.getFullYear(), today.getMonth(), 0).getDate();
                datediff = (num_days - birthdate.getDate()) + today.getDate()
            }
        } else {
            monthdiff = 11
            if (datediff < 0) {
                var num_days = new Date(birthdate.getFullYear(), today.getMonth(), 0).getDate();
                datediff = (num_days - birthdate.getDate()) + today.getDate()
            }
        }
    } else if (datediff < 0) {
        monthdiff--;
        var num_days = new Date(birthdate.getFullYear(), today.getMonth(), 0).getDate();
        datediff = (num_days - birthdate.getDate()) + today.getDate()
    }
    return yeardiff + " ปี " + monthdiff + " เดือน " + datediff + " วัน";
}