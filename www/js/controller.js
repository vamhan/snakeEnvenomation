
var skipInput = true;
var divide = 750; // 3600 // 1

angular.module('snakeEnvenomation.controllers', ['ionic', 'ngCordova'])

    .controller('SignInCtrl', function ($scope, $state, $ionicHistory, UserService, RecordService, $ionicPopup) {

        $scope.user = {}
        $scope.patient = {}
        if (skipInput) {
            $scope.user.username = "noon"
            $scope.patient.id = "1100700764035"
        }

        $scope.login = function (form, user, patient) {
            if (form.$valid) {
                UserService.loginUser(user.username, patient.id).success(function (data) {
                    RecordService.getAllActiveRecords().success(function (data) {
                        RecordService.getAllActiveRecords();
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
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
    })

    .controller('RecordCtrl', function ($scope, $state, $ionicHistory, $cordovaDatePicker, $parse, UserService, RecordService, $cordovaGeolocation, $timeout) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.patient.patient_gender = !UserService.getPatientInfo().patient_gender ? "Male" : UserService.getPatientInfo().patient_gender
        var birthdate = $scope.patient.patient_birthdate ? new Date($scope.patient.patient_birthdate) : new Date()
        $scope.age = getAge(birthdate)
        $scope.patient.patient_birthdate = birthdate.getDate() + " " + monthNames[birthdate.getMonth()] + " " + birthdate.getFullYear()

        $scope.incident = {}
        var record = RecordService.getRecordOfPatient();
        if (record.incident_date) {
            var incidentDate = new Date(record.incident_date);
            $scope.incident.incident_date = incidentDate.getDate() + " " + monthNames[incidentDate.getMonth()] + " " + incidentDate.getFullYear()
            $scope.incident.incident_time = record.incident_time
            $scope.incident.incident_district = record.incident_district;
            $scope.incident.incident_province = record.incident_province;
        } else {
            var today = new Date();
            $scope.incident.incident_date = today.getDate() + " " + monthNames[today.getMonth()] + " " + today.getFullYear()
            var minute = today.getMinutes()
            if (minute < 10)
                minute = "0" + today.getMinutes()
            $scope.incident.incident_time = today.getHours() + ":" + minute

            var hasData = false
            var posOptions = { timeout: 10000, enableHighAccuracy: false };
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
                }
                );
        }


        $scope.openDatePicker = function (element) {
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
            $cordovaDatePicker.show(options).then(function (date) {
                var dateS = date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear()
                var model = $parse(element)
                model.assign($scope, dateS)
                if (element == 'patient.patient_birthdate')
                    $scope.age = getAge(new Date($scope.patient.patient_birthdate))
            });
        }

        $scope.openTimePicker = function (element) {
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
            $cordovaDatePicker.show(options).then(function (date) {
                var minute = date.getMinutes()
                if (date.getMinutes() < 10)
                    minute = "0" + date.getMinutes()
                var timeS = date.getHours() + ":" + minute
                var model = $parse(element)
                model.assign($scope, timeS)
            });
        }

        $scope.confirm = function (user, patient, incident) {
            RecordService.addRecord(incident);
            UserService.updateUserInfo(user);
            UserService.updatePatientInfo(patient);
            $state.go('patientPUtil');
        };
    })

    .controller('PatientPUtilCtrl', function ($scope, $state, $ionicHistory, SnakeService, RecordService, StageService, BloodTestService, MotorWeaknessService, $ionicPopover, $ionicPopup, $timeout) {
        $scope.b_y_class = "button-dark";
        $scope.b_n_class = "button-positive";
        $scope.r_y_class = "button-dark";
        $scope.r_n_class = "button-positive";

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
                angular.forEach($scope.snakes, function (value, key) {
                    value["imgs"] = value.snake_images_url.split(",");
                });
            });
        });

        $scope.snakeCheckbox = [];

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
            $scope.popover.remove();
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
                RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                if ($scope.r_y_class == "button-positive") {
                    StageService.getAllStagesOfSnakeType(9).success(function (stage) {
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
                    });
                } else if ($scope.b_y_class == "button-positive") { // to systemic bleeding management
                    StageService.getAllStagesOfSnakeType(8).success(function (stage) {
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
                    });
                } else if (selectedSnake == 0 || selectedSnake == 1 || selectedSnake == 2) { // to hematotoxic snake management
                    BloodTestService.getBloodTests(); // get all previous blood tests of this record
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $state.go('bloodSample', { snake: selectedSnake, stage: stage.stage_num, times: 1 });
                    });
                } else if (selectedSnake == 3 || selectedSnake == 4 || selectedSnake == 5 || selectedSnake == 6) { // to neurotoxic snake management
                    MotorWeaknessService.getMotorWeaknesses();
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $state.go('motorWeakness', { snake: selectedSnake, stage: stage.stage_num, times: 0 });
                    });
                } else { // to unknown snake management
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $state.go('unknownTest', { snake: selectedSnake, stage: stage.stage_num, times: 0 });
                    });
                }
            }
        };
    })

    .controller('BloodSampleCtrl', function ($scope, $state, $ionicHistory, BloodTestService, SnakeService, StageService, $ionicPopup) {

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        $scope.bloodTest.INR = 0.8
        $scope.bloodTest.platelets = 150000

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        $scope.confirm = function (bloodTest) {

            // validate input
            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            var valid = true;
            angular.forEach(angular.element(document.querySelectorAll("#blood_view input")), function (value, key) {
                var element = angular.element(value)
                if (element.attr('ng-model') == "bloodTest.INR" && !angular.element(value).val()) {
                    bloodTest.INR = 0.8
                } else if (element.attr('ng-model') == "bloodTest.platelets" && !angular.element(value).val()) {
                    bloodTest.platelets = 150000
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

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, bloodTest, times);
                if (nextStage == stage.stage_num) {
                    times++;
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

    .controller('HManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, BloodTestService, SnakeService, StageService, $timeout) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();
        $scope.bloodTest = BloodTestService.getLatestBloodTest();



        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;

        $scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0

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

        if (stage.action_type == "alert") {
            $timeout(function () {
                alert(stage.action_text);
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('bloodSample', { snake: $state.params.snake, stage: stage.stage_num, times: $state.params.times });
            }, (stage.frequent / divide) * 1000);
        }

    })

    .controller('bloodResultCtrl', function ($scope, $state, BloodTestService) {
        $scope.bloodTests = BloodTestService.getBloodTests();

        $scope.bloodTest = $scope.bloodTests[$state.params.index];

        $scope.navigateToBloodResult = function (index) {
            $state.go('bloodResult', { index: index });
        };
    })


    .controller('MotorWeaknessCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, MotorWeaknessService, $ionicPopup) {

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
                var data = {};
                data["respiratory_failure"] = $scope.r_y_class == "button-positive" ? 1 : 0
                data["motor_weakness"] = $scope.m_y_class == "button-positive" ? 1 : 0

                MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0);

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, data, times);
                if (nextStage == stage.stage_num) {
                    times++;
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

    .controller('NManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, StageService, MotorWeaknessService, $timeout) {

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
        $scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0

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

        if (stage.action_type == "alert") {
            $timeout(function () {
                alert(stage.action_text);
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('motorWeakness', { snake: $state.params.snake, stage: stage.stage_num, times: $state.params.times });
            }, (stage.frequent / divide) * 1000);
        }

    })

    .controller('WeaknessResultCtrl', function ($scope, $state, MotorWeaknessService) {
        $scope.motorWeaknesses = MotorWeaknessService.getMotorWeaknesses();
    })


    .controller('UnknownTestCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, RecordService, BloodTestService, MotorWeaknessService, $ionicPopup) {

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        $scope.bloodTest.INR = 0.8
        $scope.bloodTest.platelets = 150000

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
        $scope.confirm = function (bloodTest) {

            // validate input
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            var valid = true;
            angular.forEach(angular.element(document.querySelectorAll("#blood_view input")), function (value, key) {
                var element = angular.element(value)
                if (element.attr('ng-model') == "bloodTest.INR" && !angular.element(value).val()) {
                    bloodTest.INR = 0.8
                } else if (element.attr('ng-model') == "bloodTest.platelets" && !angular.element(value).val()) {
                    bloodTest.platelets = 150000
                } else if (angular.element(value).val() && !decimalRegex.test(angular.element(value).val())) {
                    valid = false;
                    $ionicPopup.alert({
                        title: element[0].previousElementSibling.innerHTML + " is invalid",
                        template: 'Only decimal value is acceptable!'
                    });
                }
            });

            var stage = StageService.getStage($state.params.stage);

            if (valid) {

                var record = RecordService.getRecord();
                if ($state.params.times == 0) {
                    record["ar"] = $scope.ar_y_class == "button-positive" ? 1 : 0
                    record["le"] = $scope.le_y_class == "button-positive" ? 1 : 0
                    record["indoor"] = $scope.in_y_class == "button-positive" ? 1 : 0
                    record["jaw"] = $scope.j_y_class == "button-positive" ? 1 : 0
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
                            BloodTestService.addBloodTest(bloodTest);
                            var stage = StageService.getStage(72);
                            var nextStage = StageService.checkCondition(stage, bloodTest, time / 6);
                            if (nextStage == 72) {
                                time++;
                                $state.go('umanagement', { snake: $state.params.snake, stage: 71, times: time });
                            } else if (nextStage == 76) { // indication for hematotoxic snake
                                if (record["ar"] == 1 || record["le"] == 0) {
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
                            StageService.getAllStagesOfSnakeType(4).success(function (stage) {
                                $state.go('nmanagement', { snake: 4, stage: 41, times: 1 });
                            });
                        } else if (record["le"] == 1 && record["jaw"] == 0) {
                            StageService.getAllStagesOfSnakeType(3).success(function (stage) {
                                $state.go('nmanagement', { snake: 3, stage: 31, times: 1 });
                            });
                        } else if (record["le"] == 0 && record["indoor"] == 1) {
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
                    BloodTestService.addBloodTest(bloodTest);

                    var times = $state.params.times;
                    var nextStage = StageService.checkCondition(stage, bloodTest, times);
                    if (nextStage == 76) { // indication for hematotoxic snake
                        if (record["ar"] == 1 || record["le"] == 0) {
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

    .controller('UManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, StageService, $timeout) {

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = RecordService.getRecord();


        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;

        if (stage.action_type == "alert") {
            $timeout(function () {
                if ($state.params.stage == 71) {
                    if ($state.params.times % 6 == 0) {
                        alert("Observe weakness and neuro sign & CBC, PT, INR, 20 min WBCT");
                    } else {
                        alert("Observe weakness and neuro sign");
                    }
                } else {
                    alert(stage.action_text);
                }
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('unknownTest', { snake: $state.params.snake, stage: stage.stage_num, times: $state.params.times });
            }, (stage.frequent / divide) * 1000);
        }

    })

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