//var divide = 60;
var divide = 360;
//var divide = 1;
var sDevide = 6;
//var sDevide = 1;

var checkConnection;
var runNotificaion;

angular.module('snakeEnvenomation.controllers', ['ionic', 'ngCordova', 'angular-md5'])

    .controller('HomeCtrl', function ($scope, $state, $ionicHistory, UserService, SnakeService, $ionicPopup, $interval, $http) {
        $scope.siteEnter = function() {

            UserService.getUserInfo();

            SnakeService.initAllSnakes().success(function (data) {
                $scope.reloadRecords();

                checkConnection = $interval(ping, 5000);
                function ping() {
                    $http.get(api_host_url + "/ping").error(function (data, status, headers, config, statusText) {
                        $ionicPopup.alert({
                            title: 'Network error!!!',
                            template: "Please check your internet connection and then try again later"
                        });
                        if (window.cordova) {
                            cordova.plugins.notification.local.cancelAll();
                        }
                        $interval.cancel(checkConnection);
                        $interval.cancel(runNotificaion);
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('home');
                    });
                }

                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('record', {isNew: true}, {reload: true});
            }).error(function () {
                $ionicPopup.alert({
                    title: 'Network error!!!',
                    template: "Please check your internet connection and then try again later"
                });
            });
        }
    })

    .controller('MainCtrl', function ($scope, $state, $ionicHistory, UserService, RecordService, StageService, 
                                    $ionicPopup, $timeout, $rootScope, $ionicLoading, $cordovaLocalNotification, $interval) {        
        
        $scope.user = {};
        $scope.patient = {};
        $scope.activeRecords = [];

        $scope.my = {};
        $scope.my.show_h_menu = false;
        $scope.my.show_n_menu = false;
        $scope.my.show_f_menu = false;
        $scope.my.search = "";

        $scope.showAlert = !window.cordova

        $scope.reloadRecords = function() {
            RecordService.getAllActiveRecords().success(function (data) {
                $timeout(function () {
                    $scope.activeRecords = data;
                    angular.forEach($scope.activeRecords, function(record, index) {
                        var incidentDate = new Date(record.incident_date);
                        record.dateFormat = dateShortFormat(incidentDate)
                    });
                });

                runNotificaion = $interval(function() {
                    checkNotification(RecordService, $timeout, $ionicPopup, UserService, $ionicHistory, $state, $scope, $cordovaLocalNotification, $interval)
                }, (60000 / sDevide));
            });

            RecordService.getAllClosedRecords().success(function (data) {
                $timeout(function () {
                    $scope.closedRecords = data;
                    angular.forEach($scope.closedRecords, function(record, index) {
                        var incidentDate = new Date(record.incident_date);
                        record.dateFormat = dateShortFormat(incidentDate);
                    });
                });
            });
        }

        $scope.logout = function() {
            UserService.logout();
            $interval.cancel(checkConnection);
            $interval.cancel(runNotificaion);
            if (window.cordova) {
                cordova.plugins.notification.local.cancelAll();
            }
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('home');
        }

        $scope.searchCases = function() {
            var filteredList = [];

            angular.forEach(RecordService.getStaticClosedRecords(), function(record, index) {
                var searchTerm = $scope.my.search.toLowerCase();
                var incidentDate = dateShortFormat(new Date(record.incident_date));
                if (record.patient.patient_name.toLowerCase().indexOf(searchTerm) != -1 
                    || incidentDate.indexOf(searchTerm) != -1
                    || record.snake.snake_name.toLowerCase().indexOf(searchTerm) != -1) {
                    filteredList.push(record);
                }
            });
            $timeout(function () {
                $scope.closedRecords = filteredList;
            });
        }
        
        $scope.newCase = function () {
            UserService.setCurrentPatient({});
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('record', {isNew: true}, {reload: true});
        }
        
        $scope.selectRecord = function (record) {
            UserService.setCurrentPatient(record.patient);
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('record', {isNew: false}, {reload: true});
        }

        $scope.selectClosedRecord = function (record) {
            UserService.setCurrentPatient(record.patient);
            RecordService.getClosedRecordOfRecordId(record.record_id);
            var snakeType = record.respiratory_failure == 1 ? 9 : record.systemic_bleeding == 1 ? 8 : record.snake_type;
            var toPage = 'hmanagement';
            if (record.snake_type == 3 || record.snake_type == 4 || record.snake_type == 5 || record.snake_type == 6) {
                toPage = 'nmanagement';
            } else if (record.snake_type == 7) {
                toPage = 'umanagement';
            }

            $ionicLoading.show({
                template: 'Loading...'
            })

            StageService.getAllStagesOfSnakeType(snakeType).success(function (stage) {
                $ionicLoading.hide();
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go(toPage, { snake: record.snake_type, stage: record.transaction.stage.stage_num, times: 1 }, {reload: true});
            });
        }

        $scope.navigateToBloodResultList = function () {
            $state.go('bloodResultList');
        };

        $scope.navigateToWeaknessResultList = function () {
            $state.go('weaknessResultList');
        };

        $scope.viewFlowChart = function () {
            var record = RecordService.getRecord();
            $state.go('flowchart', {snake: record.snake_type, stage: record.transaction.stage.stage_num});
        };

        $scope.viewAnaphylaxis = function () {
            $state.go('generalInfo', {type: "anaphylaxis"});
        };

        $scope.viewWoundCare = function () {
            $state.go('generalInfo', {type: "wound"});
        };
        
        $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            if ($scope.activeRecords.length > 0) {
                var data = JSON.parse(notification.data);
                UserService.setCurrentPatient(data.patient);
                RecordService.getRecordOfPatient();
                $state.go('patientPUtil', { totest:data.totest }, {reload: true});
            } else {
                $state.go('home');
            }
        })
    })

    .controller('SignInCtrl', function ($scope, $state, $ionicHistory, UserService, $ionicPopup, md5, $ionicModal) {        
        $scope.user = {};

        if (testMode) {
            $scope.user.email = "vam_han@hotmail.com"
            $scope.user.password = "password"
        }

        $ionicModal.fromTemplateUrl('templates/account/forgetPassword.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.passwordModal = modal;
        });
        
        $scope.goToResetPassword = function() {
            $scope.passwordModal.show()
        }

        $ionicModal.fromTemplateUrl('templates/account/register.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.regisModal = modal;
        });
        
        $scope.goToRegister = function() {
            $scope.regisModal.show()
        }

        $scope.login = function (form, user) {
            if (form.$valid) {
                var password = md5.createHash(user.password || '');
                UserService.loginUser(user.email, password).success(function (data) {
                    delete data.password
                    window.localStorage.setItem("user", JSON.stringify(data));

                    $scope.modal.hide();

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('home');

                }).error(function (data) {
                    if (data.status == 1) {
                        $ionicPopup.alert({
                            title: 'Please check your credentials!',
                            template: data.message
                        });
                    } else if (data.status == 2) {
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Please check your email',
                            template: data.message +
                                "If you haven't received any email, click Resend button",
                            okText: "Resend"
                        });

                        confirmPopup.then(function(res) {
                            if(res) {
                                UserService.resendMail(user.email)
                            }
                        });
                    } else if (data.status == 401) {
                        $ionicPopup.alert({
                            title: 'Please check your credentials!',
                            template: 'No user with this email!'
                        });
                    } else {
                        $ionicPopup.alert({
                            title: 'Network error!!!',
                            template: "Please check your internet connection and then try again later"
                        });
                    }
                });
            }
        };
    })

    .controller('RegisterCtrl', function ($scope, $state, $ionicHistory, UserService, $timeout, $ionicPopup, md5) {
        $scope.regisuser = {};
        $scope.regisuser.physician_type = "General";
        $scope.show_username = false;

        $scope.selectUserType = function () {
            $scope.show_username = $scope.regisuser.physician_type != 'General';
        }

        $scope.confirm = function (form, user) {

            $scope.show_error = true;
            
            // validate input 
            var valid = user.password == user.confirm_password;
            $scope.show_confirm_ps = !valid;

            var phR = /^[0-9]{5}$/
            var nR = /^[0-9]{13}$/
            if ((user.physician_type == "Physician" || user.physician_type == "Pharmacist") && !phR.test(user.physician_id)) {
                valid = false;
                $scope.show_phid_error = true;
            } else if (user.physician_type == "Nurse" && !nR.test(user.physician_id)) {
                valid = false;
                $scope.show_phid_error = true;
            } else {
                $scope.show_phid_error = false;
            }
            
            if (form.$valid && valid) {
                user.password = md5.createHash(user.password || '');
                UserService.register(user).success(function () {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Please check your email',
                        template: "We sent you a confirmation email with a link to activate your account." + 
                            "Please check your email and click the link before you can login to the system." +
                            "If you haven't received any email, click Resend button",
                        okText: "Resend"
                    });

                    confirmPopup.then(function(res) {
                        if(res) {
                            UserService.resendMail(user.email)
                        }
                    });

                    $scope.regisuser = {};
                    $scope.regisuser.physician_type = "General";
                    $scope.show_username = false;
                    $scope.show_error = false

                    $scope.regisModal.hide();
                    $state.go('home');
                }).error(function (data) {
                    if (data) {
                        user.password = "";
                        $ionicPopup.alert({
                            title: 'Register fail',
                            template: data.message
                        });
                    } else {
                        $ionicPopup.alert({
                            title: 'Network error!!!',
                            template: "Please check your internet connection and then try again later"
                        });
                    }
                });
            }
        };

    })

    .controller('ActivateAccountCtrl', function ($stateParams, UserService) {
        UserService.activate($stateParams.user_id)
    })

    .controller('ForgetPasswordCtrl', function ($state, $scope, UserService, $ionicPopup) {
        $scope.abc = {};
        $scope.confirm = function (form, email) {
            $scope.show_error = true;

            if (form.$valid) {
                UserService.forgetPassword(email).success(function () {
                    $ionicPopup.alert({
                        title: 'Please check your email',
                        template: "We sent you an email with a link to reset your password. " + 
                            "Please check your email and click the link provided."
                    });

                    $scope.abc = {};
                    $scope.show_error = false;
                    $scope.passwordModal.hide();
                    $state.go('home');
                }).error(function (data) {
                    if (data) {
                        $ionicPopup.alert({
                            title: 'Process fail',
                            template: data.message
                        });
                    } else {
                        $ionicPopup.alert({
                            title: 'Network error!!!',
                            template: "Please check your internet connection and then try again later"
                        });
                    }
                });
            }
        }
    })

    .controller('ResetPasswordCtrl', function ($state, $scope, $stateParams, UserService, md5, $ionicPopup, $ionicHistory) {
        $scope.confirm = function (form, password, confirm_password) {
            var valid = password == confirm_password;
            $scope.show_confirm_ps = !valid;

            if (form.$valid && valid) {
                
                UserService.resetPassword($stateParams.user_id, $stateParams.token, md5.createHash(password || '')).success(function () {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Reset password successfully',
                        template: 'Please click OK to go to the login page'
                    });
                    alertPopup.then(function(res) {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('home');
                    });
                }).error(function (data) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Reset password fail',
                        template: 'Please contact web admin'
                    });
                    alertPopup.then(function(res) {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('home');
                    });
                });
            }
        }
    })

    .controller('RecordCtrl', function ($scope, $state, $ionicHistory, $cordovaDatePicker, UserService, RecordService, 
                                    $cordovaGeolocation, $timeout, $ionicPopup, $ionicLoading) {

        $scope.my.show_h_menu = false;
        $scope.my.show_n_menu = false;
        $scope.my.show_f_menu = false;
        RecordService.getProvinces().success(function (data) {
            $scope.provinces = data;
        })

        $scope.user = UserService.getUserInfo();
        $scope.incident = {}

        $scope.retrievePatient = function() {
            if ($scope.patient.patient_national_id.length == 13) {
                if (RecordService.isRecordOfPatientExisting($scope.patient.patient_national_id)) {
                    $scope.patient.patient_national_id = ""
                    $ionicPopup.alert({
                        title: 'Existing Record',
                        template: "There is already an active record with this patient national id. Please select the record from the left menu"
                    });
                } else {
                    UserService.getPatientInfoById($scope.patient.patient_national_id).success(function (data) {
                        $scope.patient = data.patient;
                        $scope.patient.patient_gender = !$scope.patient.patient_gender ? "Male" : $scope.patient.patient_gender
                        var birthdate = $scope.patient.patient_birthdate ? new Date($scope.patient.patient_birthdate) : new Date()
                        var age = getAge(birthdate)
                        $scope.patient.age_year = age.year;
                        $scope.patient.age_month = age.month;
                        $scope.patient.age_day = age.day;
                        $scope.incident.incident_district = data.patient.incident_district
                        $scope.incident.incident_province = data.patient.incident_province;
                    });
                }
            }
        }

        $scope.editNationalId = !$state.params.isNew

        $scope.patient = UserService.getPatientInfo();
        $scope.patient.patient_gender = !$scope.patient.patient_gender ? "Male" : $scope.patient.patient_gender
        var birthdate = $scope.patient.patient_birthdate ? new Date($scope.patient.patient_birthdate) : new Date()
        var age = getAge(birthdate)
        $scope.patient.age_year = age.year;
        $scope.patient.age_month = age.month;
        $scope.patient.age_day = age.day;
        
        $scope.selectedItem = {}
        var record = RecordService.getRecordOfPatient();
        var incidentDate = new Date();
        var incidentTime = new Date();
        if (record.incident_date) {
            $scope.disable_date = true;
            incidentDate = new Date(record.incident_date);
            incidentTime.setHours(record.incident_time.split(":")[0])
            incidentTime.setMinutes(record.incident_time.split(":")[1])
            $scope.incident.incident_date = incidentDate;
            $scope.incident.incident_time = new Date(incidentTime.getTime() - (incidentTime.getTime() % 60000));
            //$scope.incident.incident_date = dateLongFormat(incidentDate);
            //$scope.incident.incident_time = record.incident_time;
            $scope.incident.incident_district = record.incident_district;
            $scope.incident.incident_province = record.incident_province;
        } else {
            $scope.disable_date = false;
            $scope.incident.incident_date = incidentDate;
            $scope.incident.incident_time = new Date(incidentTime.getTime() - (incidentTime.getTime() % 60000));
            //$scope.incident.incident_date = dateLongFormat(incidentDate)
            //$scope.incident.incident_time = timeFormat(incidentDate);

            var hasData = false
            var posOptions = { timeout: 10000, enableHighAccuracy: true };
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    //var latlng = new google.maps.LatLng(13.563257, 100.637707);
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            var country = "";
                            if (results[0]) {
                                $timeout(function () {
                                    for (var i = 0; i < results[0].address_components.length; i++) {
                                        for (var j = 0; j < results[0].address_components[i].types.length; j++) {
                                            var type = results[0].address_components[i].types[j];
                                            if (type == "sublocality_level_1" || type == "administrative_area_level_2") {
                                                $scope.incident.incident_district = results[0].address_components[i].long_name;
                                            } else if (type == "locality" || type == "administrative_area_level_1") {
                                                $scope.incident.incident_province = results[0].address_components[i].long_name;
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    });
                }, function (err) {
                    //alert("Current location cannot be retrieved")
                });
        }

        $scope.selectProvince = function () {
            $scope.incident.incident_province = $scope.selectedItem.province.PROVINCE_NAME;
            RecordService.getDistricts($scope.selectedItem.province.PROVINCE_ID).success(function (data) {
                $scope.districts = data;
            })
        }

        $scope.selectDistrict = function () {
            $scope.incident.incident_district = $scope.selectedItem.district.AMPHUR_NAME;
        }

        $scope.openDatePicker = function (element) {
            /*var date;
            if (element == 'patient.patient_birthdate') {
                date = birthdate
            } else if (element == 'incident.incident_date') {
                date = incidentDate
            }*/
            if (window.cordova) {
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
            } else {
                $("#mydate").datepicker("show");
            }
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
            var valid = true;
            var integerRegex = /^[0-9]{13}$/
            if (patient.patient_national_id && !integerRegex.test(patient.patient_national_id)) {
                valid = false;
                $ionicPopup.alert({
                    title: "Patient national ID is invalid",
                    template: 'Only number with length 13 is acceptable!'
                });
            } 
            if (!patient.patient_name) {
                valid = false;
                $ionicPopup.alert({
                    title: "Patient name is invalid",
                    template: 'This field is required'
                });
            } 
            integerRegex = /^[0-9]*$/
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
            var today = new Date();
            if (incident.incident_date.getTime() > today.getTime()) {
                valid = false;
                $ionicPopup.alert({
                    title: 'Date of incident is invalid',
                    template: "Selected date later than today is not allow"
                });
            } else if (incident.incident_date.toDateString() == today.toDateString() && 
                (incident.incident_time.getHours() > today.getHours() || (incident.incident_time.getHours() == today.getHours() && incident.incident_time.getMinutes() > today.getMinutes()))) {
                valid = false;
                $ionicPopup.alert({
                    title: 'Time of incident is invalid',
                    template: "Selected time later than current time is not allow"
                });
            }

            if (valid) {
                UserService.updateUserInfo(user);

                $ionicLoading.show({
                    template: 'Loading...'
                })

                UserService.updatePatientInfo(patient, getBirthdateFromAge(patient.age_year, patient.age_month, patient.age_day)).success(function () {
                    $ionicLoading.hide();
                    $timeout(function () {
                        RecordService.addRecord(incident).success(function(data){
                            var newRecord = data;
                            var flag = true;
                            angular.forEach($scope.activeRecords, function(record, index) {
                                if (record.record_id == newRecord.record_id) {
                                    flag = false;
                                }
                            });
                            if (flag) {
                                $scope.activeRecords.unshift(newRecord)
                            }
                            angular.forEach($scope.activeRecords, function(record, index) {
                                var incidentDate = new Date(record.incident_date);
                                record.dateFormat = dateShortFormat(incidentDate)
                            });
                        });
                    });
                    $state.go('patientPUtil', { totest:0 }, {reload: true});
                });
            }
        };
    })

    .controller('PatientPUtilCtrl', function ($scope, $state, $ionicHistory, UserService, SnakeService, RecordService, 
                                                StageService, BloodTestService, $ionicPopover, 
                                                $ionicPopup, $timeout, $ionicModal, $ionicLoading) {

        var record = RecordService.getRecord();
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();

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

        $scope.snakes = SnakeService.getAllSnakes();

        $scope.snakeCheckbox = [];
        $scope.snakeCheckbox[record.snake_type] = true;

        $scope.snakeTypeSelect = function (selectedSnake) {
            angular.forEach($scope.snakeCheckbox, function (value, key) {
                $scope.snakeCheckbox[key] = false;
            });
            $scope.snakeCheckbox[selectedSnake] = true;
        };

        $ionicModal.fromTemplateUrl('templates/modal.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });
        
        $scope.openModal = function(pic) {
            if (pic.indexOf("unknown") <= -1) {
                $scope.modal.show()
                $scope.imgUrl = "img/snake/" + pic
            }
        }

        $scope.openPopover = function ($event, id) {
            var template = '<ion-popover-view><ion-header-bar> <h1 class="title">' + $scope.snakes[id].snake_thai_name + '</h1> </ion-header-bar> <ion-content class="padding" scroll="false">' + $scope.snakes[id].info + '</ion-content></ion-popover-view>';
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

                $ionicLoading.show({
                    template: 'Loading...'
                })

                if (($scope.r_y_class == "button-positive" && $scope.b_y_class == "button-positive") || (record.transaction && record.snake_type != selectedSnake)) {
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction) {
                            selectedSnake = record.snake_type
                        }
                        var toPage = 'hmanagement';
                        if (selectedSnake == 3 || selectedSnake == 4 || selectedSnake == 5 || selectedSnake == 6) {
                            toPage = 'nmanagement';
                        } else if (selectedSnake == 7) {
                            toPage = 'umanagement';
                        }
                        // log current transaction
                        var nStage = StageService.getStage(36);
                        StageService.updateTransactionPCReason(nStage, 1, "Data Discordance");

                        $state.go(toPage, { snake: selectedSnake, stage: 36, times: 1 }, {reload: true});
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if ($scope.r_y_class == "button-positive") { // to respiratory failure management
                    StageService.getAllStagesOfSnakeType(9).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction && record.respiratory_failure) { // already start management process and if it was respiratory_failure previously
                            /*if (record.transaction.stage.stage_num < 90) {
                                StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                                    $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times}, {reload: true});
                                });
                            } else {*/
                                $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times}, {reload: true});
                            //}
                        } else {
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
                                    nextStage = 36
                                    break;
                            }

                            // log current transaction
                            var nStage = StageService.getStage(nextStage);
                            StageService.logTransaction(nStage, 1)

                            if (nextStage == 36) {
                                var toPage = 'hmanagement';
                                if (selectedSnake == 7) {
                                    toPage = 'umanagement';
                                }
                                // log current transaction
                                var nStage = StageService.getStage(36);
                                StageService.updateTransactionPCReason(nStage, 1, "Data Discordance");

                                $state.go(toPage, { snake: selectedSnake, stage: 36, times: 1 }, {reload: true});
                            } else {
                                $state.go('nmanagement', { snake: selectedSnake, stage: nextStage, times: 1});
                            }
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                        
                    });
                } else if ($scope.b_y_class == "button-positive") { // to systemic bleeding management
                    StageService.getAllStagesOfSnakeType(8).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction && record.systemic_bleeding) { // already start management process and if it was systemic_bleeding previously
                            $state.go('hmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                        } else {
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
                                    nextStage = 36
                                    break;
                            }

                            // log current transaction
                            var nStage = StageService.getStage(nextStage);
                            StageService.logTransaction(nStage, 1)

                            if (nextStage == 36) {
                                var toPage = 'nmanagement';
                                if (selectedSnake == 7) {
                                    toPage = 'umanagement';
                                }
                                // log current transaction
                                var nStage = StageService.getStage(36);
                                StageService.updateTransactionPCReason(nStage, 1, "Data Discordance");

                                $state.go(toPage, { snake: selectedSnake, stage: 36, times: 1 }, {reload: true});
                            } else {
                                $state.go('hmanagement', { snake: selectedSnake, stage: nextStage, times: 1});
                            }
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if (selectedSnake == 0 || selectedSnake == 1 || selectedSnake == 2) { // to hematotoxic snake management
                    BloodTestService.getBloodTests();
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction) {
                            if ($state.params.totest == 1) {
                                $state.go('bloodSample', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                            } else {
                                $state.go('hmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                            }
                        } else {
                            // log current transaction
                            StageService.logTransaction(stage, 1)

                            $state.go('bloodSample', { snake: selectedSnake, stage: stage.stage_num, times: 1 }, {reload: true});
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else if (selectedSnake == 3 || selectedSnake == 4 || selectedSnake == 5 || selectedSnake == 6) { // to neurotoxic snake management
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction) { // already start management process
                            if ($state.params.totest == 1) {
                                $state.go('motorWeakness', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times}, {reload: true});
                            } else {
                                $state.go('nmanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times}, {reload: true});
                            }
                        } else {
                            // log current transaction
                            StageService.logTransaction(stage, 1)

                            $state.go('motorWeakness', { snake: selectedSnake, stage: stage.stage_num, times: 1 });
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                } else { // to unknown snake management
                    BloodTestService.getBloodTests();
                    StageService.getAllStagesOfSnakeType(selectedSnake).success(function (stage) {
                        $ionicLoading.hide()
                        if (record.transaction) { // already start management process
                            if ($state.params.totest == 1) {
                                $state.go('unknownTest', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                            } else if ($state.params.totest == 2) {
                                $state.go('unknownTest', { snake: selectedSnake, stage: 71, times: record.transaction2.times }, {reload: true});
                            } else {
                                $state.go('umanagement', { snake: selectedSnake, stage: record.transaction.stage.stage_num, times: record.transaction.times }, {reload: true});
                            }
                        } else {
                            // log current transaction
                            var nStage = StageService.getStage(72);
                            StageService.logTransaction(nStage, 0)
                            StageService.logTransaction2(stage, 0)

                            $state.go('unknownTest', { snake: selectedSnake, stage: stage.stage_num, times: 0 }, {reload: true});
                        }
                        RecordService.updateRecord($scope.b_y_class == "button-positive", $scope.r_y_class == "button-positive", selectedSnake)
                    });
                }
            }
        };
    })

    .controller('BloodSampleCtrl', function ($scope, $state, $ionicHistory, BloodTestService, SnakeService, StageService, 
                                    RecordService, UserService, $ionicPopup, $timeout, $cordovaLocalNotification) {

        $scope.my.show_h_menu = true;
        $scope.my.show_n_menu = false;
        $scope.my.show_f_menu = true;

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"

        $scope.inr_class = "button-outline button-dark";
        $scope.p_class = "button-outline button-dark";

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        var stage = StageService.getStage($state.params.stage);

        $scope.toggleINRValue = function (value) {
            if ($scope.inr_class == "button-outline button-dark") {
                $scope.inr_class = "button-balanced";
                $scope.bloodTest.INR = null;
            } else {
                $scope.inr_class = "button-outline button-dark";
            }
        }

        $scope.togglePlateletValue = function (value) {
            if ($scope.p_class == "button-outline button-dark") {
                $scope.p_class = "button-balanced";
                $scope.bloodTest.platelets = null;
            } else {
                $scope.p_class = "button-outline button-dark";
            }
        }

        $scope.confirm = function (scopeBloodTest) {
            
            var bloodTest = {};
            angular.forEach(scopeBloodTest, function (value, key) {
                bloodTest[key] = value;
            });

            // validate input
            var valid = true;
            if (!('INR' in scopeBloodTest) && $scope.inr_class == "button-outline button-dark") {
                valid = false;
                $ionicPopup.alert({
                    title: "INR is Require",
                    template: 'Only decimal value is acceptable!'
                });
            }

            if (!('platelets' in scopeBloodTest) && $scope.p_class == "button-outline button-dark") {
                valid = false;
                $ionicPopup.alert({
                    title: "Platelets is Require",
                    template: 'Only decimal value is acceptable!'
                });
            }

            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            angular.forEach(scopeBloodTest, function (value, key) {
                if (key != "WBCT" && key != "ua_blood" && key != "RBC") {
                    bloodTest[key] = Number(value)
                    if (value && !decimalRegex.test(value)) {
                        valid = false;
                        $ionicPopup.alert({
                            title: key + " is invalid",
                            template: 'Only decimal value is acceptable!'
                        });
                    }
                }
            });

            if (valid) {

                // warning alert
                var latestBloodTest = BloodTestService.getLatestBloodTest();
                if (bloodTest.Hct < 30) {
                    $ionicPopup.alert({
                        title: "Hematocrit Warning",
                        template: 'Hematocrit น้อยกว่า 30%'
                    });
                }
                if (latestBloodTest != null && bloodTest.Hct <= latestBloodTest.Hct - 3) {
                    $ionicPopup.alert({
                        title: "Hematocrit Warning",
                        template: 'Hematocrit ลดลงจากค่าเดิมมากกว่าหรือเท่ากับ 3%'
                    });
                }
                if (bloodTest.creatinine > 1.2) {
                    $ionicPopup.alert({
                        title: "Creatinine Warning",
                        template: 'Creatinine มากกว่า 1.2 mg/dL'
                    });
                }
                if (latestBloodTest != null && bloodTest.creatinine >= latestBloodTest.creatinine + 0.5) {
                    $ionicPopup.alert({
                        title: "Creatinine Warning",
                        template: 'Creatinine มากกว่าค่าเดิม 0.5 mg/dL'
                    });
                }
                if (bloodTest.ua_blood == "Positive") {
                    $ionicPopup.alert({
                        title: "Blood Warning",
                        template: 'Blood ใน urine positive โปรดระวังอาจมี hemolysis ได้'
                    });
                }

                var record = RecordService.getRecord();
                
                // clear previous notification
                if (window.cordova) {
                    var previousId = parseInt(record.record_id + "000" + stage.stage_num)
                    $cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                        if (present) {
                            $cordovaLocalNotification.clear(previousId);
                        }
                    });
                }

            
                BloodTestService.addBloodTest(scopeBloodTest, $state.params.stage, $state.params.times, 0);

                // check for default value
                if ($scope.inr_class == "button-balanced") {
                    bloodTest.INR = 0.8
                }
                if ($scope.p_class == "button-balanced") {
                    bloodTest.platelets = 150000
                }

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

                // log current transaction
                var nStage = StageService.getStage(nextStage);
                StageService.logTransaction(nStage, times)

                // update notification schedule
                if (times == 1) {
                    RecordService.updateNotification(record, nextStage, new Date(), 1);
                } else if (times == 2 && record.transaction.stage.frequent == 86400) {
                    RecordService.updateNotification(record, nextStage, new Date(), 2);
                } else {
                    var lastNotifTime = new Date(record.notif_datetime).getTime();
                    var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                    var now = new Date().getTime();
                    if ((times - 1) == record.notif_times && lastNotifTime + frequent > now) {
                        RecordService.updateNotification(record, nextStage, new Date(lastNotifTime + frequent), (record.notif_times + 1));
                    }
                }

                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('hmanagement', { snake: $state.params.snake, stage: nextStage, times: times });
            }
        };


    })

    .controller('HManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, 
                                        BloodTestService, SnakeService, StageService, $timeout) {

        var record = RecordService.getRecord();
        $scope.my.show_h_menu = true;
        $scope.my.show_n_menu = record.status == "active" ? false : true;
        $scope.my.show_f_menu = true;

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = record;

        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;

        $scope.action_text = (stage.addition_text != null && $state.params.times == 1) ? stage.addition_text + "\n" + stage.action_text : stage.action_text;

        if (stage.action_type == "alert") {
            var nextCheckText = "";
            if ($state.params.times > 1) {
                nextCheckText = "(ตรวจครั้งสุดท้ายเวลา " + dateTimeFormat(record.transaction.datetime) + ")";
            }
            $scope.times = "ตรวจไปแล้ว " + ($state.params.times - 1) + " ครั้ง " + nextCheckText;
        }

        if (stage.action_type == 'call') {
            $scope.consult_reason = " - " + (record.transaction.consult_reason ? record.transaction.consult_reason : "Emergency case");
        }
        

        $scope.show_skip = stage.relate_to == "blood test";
        //$scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0
        $scope.show_call = stage.action_type == "call";
        //$scope.show_close_case = stage.relate_to == "close";

        if (stage.relate_to == "close" && record.status == "active") {
            RecordService.updateNotifActive(record, 0);
            RecordService.closeCase();
            $timeout(function () {
                var index = 0;
                angular.forEach($scope.activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        index = i;
                        value.notif_active = 0;
                    }   
                });
                $scope.activeRecords.splice(index, 1);
            });
        }

        $scope.skip = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('patientPUtil', { totest:1 }, {reload: true});
        }

        /*$scope.closeCase = function () {
            $timeout(function () {
                RecordService.closeCase($scope.activeRecords);
            });
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('signin');
        };*/

        $scope.show_checktime = stage.action_type == "alert";
        updateCheckTime();
        $scope.doRefresh = function() {
            updateCheckTime();
        };

        function updateCheckTime() {
            $scope.totalCheckTimes = [];
            for (var i = 1; i <= stage.times; i++) {
                var item = {};
                item.number = i;
                item.class = $state.params.times - 1 >= i ? "active" : record.notif_times - 1 >= i ? "notif" : "";
                $scope.totalCheckTimes.push(item);
            }
        }


        $scope.showPopup = function (type) {
            var title = ""
            var content = ""
            if (type == 0) {
                title = "Indication for antivenom"
                content = "<ul style='list-style: circle;-webkit-padding-start: 1em;'><li>Systemic bleeding (except microscopic hematuria) or</li>"
                    + "<li>Platelets < 100,000/mcL or</li>"
                    + "<li>INR >= 1.20 or</li>"
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

        /*$scope.navigateToNextStage = function () {
            var nStage = StageService.getStage(stage.next_yes_stage);
            StageService.logTransaction(nStage, 1)
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('hmanagement', { snake: $state.params.snake, stage: stage.next_yes_stage, times: 1 });
        };*/
        
        // update badge
        if (record.notif_stage == record.transaction.stage.stage_num && record.notif_times <= record.transaction.times) {
            RecordService.updateNotifActive(record, 0);
            $timeout(function () {
                angular.forEach($scope.activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        value.notif_active = 0;
                    }   
                });
            });
        }

    })

    .controller('BloodResultListCtrl', function ($scope, $state, BloodTestService, $timeout, $ionicLoading) {
        $ionicLoading.show({
            template: 'Loading...'
        })
        BloodTestService.getBloodTests().success(function (data) {
            $ionicLoading.hide()
            $timeout(function () {
                $scope.bloodTests = data;

                $scope.navigateToBloodResult = function (id) {
                    $state.go('bloodResult', { id: id });
                };
            });
        })
    })

    .controller('BloodResultCtrl', function ($scope, $state, BloodTestService, RecordService) {
        $scope.bloodTest = BloodTestService.getBloodTestById($state.params.id);

        var record = RecordService.getRecord();
        var last = BloodTestService.getLatestBloodTest();
        $scope.show_edit_button = last.test_id == $scope.bloodTest.test_id && record.status == 'active'

        $scope.editBloodTest = function () {
            $state.go('editBloodTest', { id: $state.params.id, snake: record.snake_type, stage: $scope.bloodTest.stage, times: $scope.bloodTest.stage_times }, {reload: true});
        };
    })

    .controller('EditBloodTestCtrl', function ($scope, $state, $ionicHistory, BloodTestService, SnakeService, StageService, 
                                        RecordService, UserService, $ionicPopup, $timeout) {

        $scope.my.show_h_menu = false;
        $scope.my.show_n_menu = false;
        $scope.my.show_f_menu = false;

        $scope.bloodTest = BloodTestService.getBloodTestById($state.params.id);

        $scope.inr_class = "button-outline button-dark";
        $scope.p_class = "button-outline button-dark";

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        var stage = StageService.getStage($state.params.stage);

        $scope.toggleINRValue = function (value) {
            if ($scope.inr_class == "button-outline button-dark") {
                $scope.inr_class = "button-balanced";
                $scope.bloodTest.INR = null;
            } else {
                $scope.inr_class = "button-outline button-dark";
            }
        }

        $scope.togglePlateletValue = function (value) {
            if ($scope.p_class == "button-outline button-dark") {
                $scope.p_class = "button-balanced";
                $scope.bloodTest.platelets = null;
            } else {
                $scope.p_class = "button-outline button-dark";
            }
        }

        $scope.confirm = function (scopeBloodTest) {
            
            var bloodTest = {};
            angular.forEach(scopeBloodTest, function (value, key) {
                bloodTest[key] = value;
            });

            // validate input
            var valid = true;
            if (!('INR' in scopeBloodTest) && $scope.inr_class == "button-outline button-dark") {
                valid = false;
                $ionicPopup.alert({
                    title: "INR is Require",
                    template: 'Only decimal value is acceptable!'
                });
            }

            if (!('platelets' in scopeBloodTest) && $scope.p_class == "button-outline button-dark") {
                valid = false;
                $ionicPopup.alert({
                    title: "Platelets is Require",
                    template: 'Only decimal value is acceptable!'
                });
            }

            //var integerRegex = /^[1-9]+[0-9]*$/
            var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
            angular.forEach(scopeBloodTest, function (value, key) {
                if (key == "INR" || key == "WBC" || key == "Hct" || key == "platelets" || key == "creatinine") {
                    bloodTest[key] = Number(value)
                    if (value && !decimalRegex.test(value)) {
                        valid = false;
                        $ionicPopup.alert({
                            title: key + " is invalid",
                            template: 'Only decimal value is acceptable!'
                        });
                    }
                }
            });

            if (valid) {
            
                BloodTestService.addBloodTest(scopeBloodTest, $state.params.stage, $state.params.times, 1);

                // check for default value
                if ($scope.inr_class == "button-balanced") {
                    bloodTest.INR = 0.8
                }
                if ($scope.p_class == "button-balanced") {
                    bloodTest.platelets = 150000
                }

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, bloodTest, times);
                var record = RecordService.getRecord();
                if (nextStage != record.transaction.stage.stage_num) {
                    // log current transaction
                    var nStage = StageService.getStage(36);
                    StageService.updateTransactionPCReason(nStage, 1, "Data Discordance");
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('hmanagement', { snake: $state.params.snake, stage: 36, times: 1 });
                } else {
                    $ionicHistory.goBack(-3);
                }
            }
        };


    })


    .controller('MotorWeaknessCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, MotorWeaknessService, 
                                        RecordService, UserService, $ionicPopup, $timeout, $cordovaLocalNotification) {

        $scope.my.show_h_menu = false;
        $scope.my.show_n_menu = true;
        $scope.my.show_f_menu = true;

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

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        
        $scope.show_progression = stage.relate_to == 'progression'

        $scope.confirm = function () {

            // validate input
            var valid = true;

            if (valid) {

                var record = RecordService.getRecord();
                
                // clear previous notification
                if (window.cordova) {
                    var previousId = parseInt(record.record_id + "000" + stage.stage_num)
                    $cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                        if (present) {
                            $cordovaLocalNotification.clear(previousId);
                        }
                    });
                }
                
                var data = {};
                data.progression = $scope.r_y_class == "button-positive" ? 1 : 0
                data.motor_weakness = $scope.m_y_class == "button-positive" ? 1 : 0

                MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0, $scope.show_progression ? ($scope.r_y_class == "button-positive" ? 1 : 0) : null, stage.stage_num, $state.params.times, 0);

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, data, times);
                if (nextStage == 4 && data.motor_weakness == 1) {
                    nextStage = 36;
                }
                if (nextStage == stage.stage_num) {
                    times++;
                } else {
                    times = 1;
                }
                if (nextStage == 0) {
                    nextStage = stage.stage_num
                }

                // log current transaction
                var nStage = StageService.getStage(nextStage);
                StageService.logTransaction(nStage, times);

                // update notification schedule
                if (times == 1) {
                    RecordService.updateNotification(record, nextStage, new Date(), 1);
                } else {
                    if (record.notif_datetime == null) {
                        RecordService.updateNotification(record, nextStage, new Date(), times);
                    } else {
                        var lastNotifTime = new Date(record.notif_datetime).getTime();
                        var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                        var now = new Date().getTime();
                        if ((times - 1) == record.notif_times && lastNotifTime + frequent > now) {
                            RecordService.updateNotification(record, nextStage, new Date(lastNotifTime + frequent), (record.notif_times + 1));
                        }
                    }
                }

                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('nmanagement', { snake: $state.params.snake, stage: nextStage, times: times});
            }
        };


    })

    .controller('NManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, 
                                    StageService, MotorWeaknessService, $timeout) {

        var record = RecordService.getRecord();
        $scope.my.show_h_menu = record.status == "active" ? false : true;;
        $scope.my.show_n_menu = true;
        $scope.my.show_f_menu = true;

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.record = record;
        var latestMotorWeakness = MotorWeaknessService.getLatestMotorWeakness();
        if (latestMotorWeakness) {
            $scope.latest_weakness = MotorWeaknessService.getLatestMotorWeakness().motor_weakness == 0 ? "no" : "yes"
        }


        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;

        $scope.action_text = (stage.addition_text != null && $state.params.times == 1) ? stage.addition_text + "\n" + stage.action_text : stage.action_text;

        if (stage.action_type == "alert") {
            var nextCheckText = "";
            if ($state.params.times > 1) {
                nextCheckText = "(ตรวจครั้งสุดท้ายเวลา " + dateTimeFormat(record.transaction.datetime) + ")";
            }
            $scope.times = "ตรวจไปแล้ว " + ($state.params.times - 1) + " ครั้ง " + nextCheckText;
        }

        if (stage.action_type == 'call') {
            $scope.consult_reason = " - " + ((record.transaction && record.transaction.consult_reason) ? record.transaction.consult_reason : "Emergency case");
        }
        

        $scope.show_skip = stage.relate_to == "motor weakness" || stage.relate_to == "progression";
        //$scope.show_next_process = stage.condition_id == 0 && stage.next_yes_stage != 0
        $scope.show_call = stage.action_type == "call";
        //$scope.show_close_case = stage.relate_to == "close";

        if (stage.relate_to == "close" && record.status == "active") {
            RecordService.updateNotifActive(record, 0);
            RecordService.closeCase();
            $timeout(function () {
                var index = 0;
                angular.forEach($scope.activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        index = i;
                        value.notif_active = 0;
                    }   
                });
                $scope.activeRecords.splice(index, 1);
            });
        }

        $scope.skip = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('patientPUtil', { totest:1 }, {reload: true});
        }

        $scope.show_checktime = stage.action_type == "alert";
        updateCheckTime();
        $scope.doRefresh = function() {
            updateCheckTime();
        };

        function updateCheckTime() {
            $scope.totalCheckTimes = [];
            for (var i = 1; i <= stage.times; i++) {
                var item = {};
                item.number = i;
                item.class = $state.params.times - 1 >= i ? "active" : record.notif_times - 1 >= i ? "notif" : "";
                $scope.totalCheckTimes.push(item);
            }
        }

        /*$scope.closeCase = function () {
            $timeout(function () {
                RecordService.closeCase($scope.activeRecords);
            });
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('signin');
        };*/

        /*$scope.navigateToNextStage = function () {
            var nStage = StageService.getStage(stage.next_yes_stage);
            StageService.logTransaction(nStage, 1)
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            /*if (stage.next_yes_stage == 31 || stage.next_yes_stage == 41 || stage.next_yes_stage == 51 || stage.next_yes_stage == 61) {
                StageService.getAllStagesOfSnakeType($state.params.snake).success(function (stage) {
                    $state.go('motorWeakness', { snake: $scope.snake, stage: stage.stage_num, times: 1 });
                });
            } else {
            $state.go('nmanagement', { snake: $state.params.snake, stage: stage.next_yes_stage, times: 1});
            //}
        };*/

        
        // update badge
        if (record.notif_stage == record.transaction.stage.stage_num && record.notif_times <= record.transaction.times) {
            RecordService.updateNotifActive(record, 0);
            $timeout(function () {
                angular.forEach($scope.activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        value.notif_active = 0;
                    }   
                });
            });
        }

    })

    .controller('WeaknessResultCtrl', function ($scope, $state, MotorWeaknessService, $timeout, $ionicLoading, RecordService) {
        $ionicLoading.show({
            template: 'Loading...'
        })
        $scope.record = RecordService.getRecord();
        MotorWeaknessService.getMotorWeaknesses().success(function (data) {
            $ionicLoading.hide();
            $timeout(function () {
                $scope.motorWeaknesses = data;
            });

            $scope.edit = function (test) {
                $state.go('editMotorWeakness', { id: test.test_id, snake: $scope.record.snake_type, stage: test.stage, times: test.stage_times }, {reload: true});
            };
        })
    })


    .controller('EditMotorWeaknessCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, 
                                            MotorWeaknessService, RecordService, UserService) {

        $scope.my.show_h_menu = false;
        $scope.my.show_n_menu = false;
        $scope.my.show_f_menu = false;

        var test = MotorWeaknessService.getMotorWeaknessById($state.params.id);

        $scope.r_y_class = test.progression == 0 ? "button-dark" : "button-positive";
        $scope.r_n_class = test.progression == 1 ? "button-dark" : "button-positive";
        $scope.m_y_class = test.motor_weakness == 0 ? "button-dark" : "button-positive";
        $scope.m_n_class = test.motor_weakness == 1 ? "button-dark" : "button-positive";

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

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        var stage = StageService.getStage($state.params.stage);
        
        $scope.show_progression = stage.relate_to == 'progression'

        $scope.confirm = function () {

            // validate input
            var valid = true;

            if (valid) {
                
                var data = {};
                data.progression = $scope.r_y_class == "button-positive" ? 1 : 0
                data.motor_weakness = $scope.m_y_class == "button-positive" ? 1 : 0

                MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0, $scope.show_progression ? ($scope.r_y_class == "button-positive" ? 1 : 0) : null, stage.stage_num, $state.params.times, 1);

                var times = $state.params.times;
                var nextStage = StageService.checkCondition(stage, data, times);
                var record = RecordService.getRecord();
                if (nextStage != record.transaction.stage.stage_num) {
                    // log current transaction
                    var nStage = StageService.getStage(36);
                    StageService.updateTransactionPCReason(nStage, 1, "Data Discordance");
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('nmanagement', { snake: $state.params.snake, stage: 36, times: 1 });
                } else {
                    $ionicHistory.goBack(-3);
                }
            }
        };


    })


    .controller('UnknownTestCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, RecordService, 
                                    BloodTestService, MotorWeaknessService, UserService, $ionicPopup, $timeout, $cordovaLocalNotification) {

        $scope.my.show_h_menu = true;
        $scope.my.show_n_menu = true;
        $scope.my.show_f_menu = true;

        $scope.m_y_class = "button-dark";
        $scope.m_n_class = "button-positive";

        $scope.bloodTest = {}
        $scope.bloodTest.WBCT = "Clotted"
        $scope.inr_class = "button-outline button-dark";
        $scope.p_class = "button-outline button-dark";

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

        $scope.toggleINRValue = function (value) {
            if ($scope.inr_class == "button-outline button-dark") {
                $scope.inr_class = "button-balanced";
                $scope.bloodTest.INR = null;
            } else {
                $scope.inr_class = "button-outline button-dark";
            }
        }

        $scope.togglePlateletValue = function (value) {
            if ($scope.p_class == "button-outline button-dark") {
                $scope.p_class = "button-balanced";
                $scope.bloodTest.platelets = null;
            } else {
                $scope.p_class = "button-outline button-dark";
            }
        }

        $scope.show_weakness = $state.params.stage == 71
        $scope.show_bloodtest = $state.params.stage == 72 || $state.params.stage == 75

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.confirm = function (scopeBloodTest) {
            
            var bloodTest = {};
            angular.forEach(scopeBloodTest, function (value, key) {
                bloodTest[key] = value;
            });

            // validate input
            var valid = true;
            if ($scope.show_bloodtest) {
                var decimalRegex = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/
                if (!('INR' in scopeBloodTest)) {
                    valid = false;
                    $ionicPopup.alert({
                        title: "INR is Require",
                        template: 'Only decimal value is acceptable!'
                    });
                }

                if (!('platelets' in scopeBloodTest)) {
                    valid = false;
                    $ionicPopup.alert({
                        title: "Platelets is Require",
                        template: 'Only decimal value is acceptable!'
                    });
                }

                angular.forEach(scopeBloodTest, function (value, key) {
                    if (key != "WBCT" && key != "ua_blood" && key != "RBC") {
                        bloodTest[key] = Number(value)
                        if (value && !decimalRegex.test(value)) {
                            valid = false;
                            $ionicPopup.alert({
                                title: key + " is invalid",
                                template: 'Only decimal value is acceptable!'
                            });
                        }
                    }
                });
            }

            var stage = StageService.getStage($state.params.stage);

            if (valid) {

                // warning alert
                var latestBloodTest = BloodTestService.getLatestBloodTest();
                if (bloodTest.creatinine > 1.2) {
                    $ionicPopup.alert({
                        title: "Creatinine Warning",
                        template: 'Creatinine มากกว่า 1.2 mg/dL'
                    });
                }
                if (latestBloodTest != null && bloodTest.creatinine >= latestBloodTest.creatinine + 0.5) {
                    $ionicPopup.alert({
                        title: "Creatinine Warning",
                        template: 'Creatinine มากกว่าค่าเดิม 0.5 mg/dL'
                    });
                }

                var record = RecordService.getRecord();
                
                // clear previous notification
                if (window.cordova) {
                    var previousId = parseInt(record.record_id + "000" + stage.stage_num)
                    $cordovaLocalNotification.isTriggered(previousId).then(function (present) {
                        if (present) {
                            $cordovaLocalNotification.clear(previousId);
                        }
                    });
                }

                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });

                var times = $state.params.times;
                if ($state.params.stage == 71) {
                    var stage = StageService.getStage(71);

                    var data = {};
                    data.motor_weakness = $scope.m_y_class == "button-positive" ? 1 : 0
                    MotorWeaknessService.addMotorWeakness($scope.m_y_class == "button-positive" ? 1 : 0, null, 71, times, 0);
                    var nextStage = StageService.checkCondition(stage, data, times);

                    if (nextStage == 77) { // to identification
                        var nStage = StageService.getStage(77);
                        StageService.logTransaction(nStage, 1);
                        RecordService.setnullNotif();
                        RecordService.setnullNotif2();
                        $state.go('identification');
                    } else if (nextStage == 71) {
                        times++;
                        // log current transaction
                        StageService.logTransaction2(stage, times)

                        // update notification schedule
                        if (record.notif_datetime2 == null) {
                            RecordService.updateNotification2(record, new Date(), times);
                        } else {
                            var lastNotifTime = new Date(record.notif_datetime2).getTime();
                            var frequent = ((record.transaction2.stage.frequent / divide) * 1000)
                            var now = new Date().getTime();
                            if ((times - 1) == record.notif_times2 && lastNotifTime + frequent > now) {
                                RecordService.updateNotification2(record, new Date(lastNotifTime + frequent), (record.notif_times2 + 1));
                            }
                        }

                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: times});
                    } else { // nextStage == 75
                        StageService.logTransaction2(stage, stage.times + 1)
                        RecordService.setnullNotif2();

                        var stage2 = StageService.getStage(72);
                        if (record.transaction.times > stage2.times) { // have to wait until finishing checking all blood test
                            // log current transaction
                            var nStage = StageService.getStage(nextStage);
                            StageService.logTransaction(nStage, 1)

                            // update notification schedule
                            RecordService.updateNotification(record, nextStage, new Date(), 1);

                            $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1});
                        } else {
                            $state.go('umanagement', { snake: $state.params.snake, stage: 71, times: times});
                        }
                    }
                } else if ($state.params.stage == 72) {
                    var stage = StageService.getStage(72);

                    BloodTestService.addBloodTest(scopeBloodTest, 72, times, 0);

                    // check for default value
                    if ($scope.inr_class == "button-balanced") {
                        bloodTest.INR = 0.8
                    }
                    if ($scope.p_class == "button-balanced") {
                        bloodTest.platelets = 150000
                    }
                    var nextStage = StageService.checkCondition(stage, bloodTest, times);

                    if (nextStage == 76) { // to identification
                        var nStage = StageService.getStage(76);
                        StageService.logTransaction(nStage, 1);
                        RecordService.setnullNotif();
                        RecordService.setnullNotif2();
                        $state.go('identification');
                    } else if (nextStage == 72) {
                        times++;
                        // log current transaction
                        StageService.logTransaction(stage, times)

                        // update notification schedule
                        if (record.notif_datetime == null) {
                            RecordService.updateNotification(record, nextStage, new Date(), times);
                        } else {
                            var lastNotifTime = new Date(record.notif_datetime).getTime();
                            var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                            var now = new Date().getTime();
                            if ((times - 1) == record.notif_times && lastNotifTime + frequent > now) {
                                RecordService.updateNotification(record, nextStage, new Date(lastNotifTime + frequent), (record.notif_times + 1));
                            }
                        }

                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: times});
                    } else { // nextStage == 75
                        StageService.logTransaction(stage, stage.times + 1);
                        RecordService.setnullNotif();

                        var stage2 = StageService.getStage(71);
                        if (record.transaction2.times > stage2.times) { // have to wait until finishing checking all motor weakness
                            // log current transaction
                            var nStage = StageService.getStage(nextStage);
                            StageService.logTransaction(nStage, 1)

                            // update notification schedule
                            RecordService.updateNotification(record, nextStage, new Date(), 1);
                            RecordService.setnullNotif2();

                            $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: 1});
                        } else {
                            $state.go('umanagement', { snake: $state.params.snake, stage: 72, times: times});
                        }
                    }
                } else { //$state.params.stage == 75
                    var stage = StageService.getStage(75);

                    BloodTestService.addBloodTest(scopeBloodTest, 75, times, 0);
                    var nextStage = StageService.checkCondition(stage, bloodTest, times);

                    if (nextStage == 76) { // to identification
                        var nStage = StageService.getStage(76);
                        StageService.logTransaction(nStage, 1);
                        RecordService.setnullNotif();
                        RecordService.setnullNotif2();
                        $state.go('identification');
                    } else {
                        times++;
                        // log current transaction
                        var nStage = StageService.getStage(nextStage);
                        StageService.logTransaction(nStage, times)

                        // update notification schedule
                        if (times == 2) {
                            RecordService.updateNotification(record, nextStage, new Date(), 2);
                        } else {
                            var lastNotifTime = new Date(record.notif_datetime).getTime();
                            var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                            var now = new Date().getTime();
                            if ((times - 1) == record.notif_times && lastNotifTime + frequent > now) {
                                RecordService.updateNotification(record, nextStage, new Date(lastNotifTime + frequent), (record.notif_times + 1));
                            }
                        }

                        $state.go('umanagement', { snake: $state.params.snake, stage: nextStage, times: times});
                    }
                }
            }
        };


    })

    .controller('IdentificationCtrl', function ($scope, $state, $ionicHistory, SnakeService, StageService, RecordService, 
                                            BloodTestService, MotorWeaknessService, UserService, $ionicPopup, 
                                            $timeout, $ionicLoading) {

        $scope.my.show_h_menu = true;
        $scope.my.show_n_menu = true;
        $scope.my.show_f_menu = true;

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

        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();

        var record = RecordService.getRecord();
        $scope.show_ar = record.transaction.stage.stage_num == 76;
        $scope.show_le = record.transaction.stage.stage_num == 73 || record.transaction.stage.stage_num == 77;
        $scope.show_indoor = record.transaction.stage.stage_num == 170
        $scope.show_jaw = record.transaction.stage.stage_num == 74

        RecordService.updateNotifActive(record, 0);
        $timeout(function () {
            angular.forEach($scope.activeRecords, function(value, i) {
                if (value.record_id == record.record_id) {
                    value.notif_active = 0;
                }   
            });
        });


        $scope.confirm = function () {

                /*if ($state.params.times == 0) {
                    RecordService.updateUnknownFields(
                        $scope.ar_y_class == "button-positive",
                        $scope.le_y_class == "button-positive",
                        $scope.in_y_class == "button-positive",
                        $scope.j_y_class == "button-positive")
                }*/

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });

            if (record.transaction.stage.stage_num == 76) {
                if ($scope.ar_y_class == "button-positive") {
                    $ionicLoading.show({
                        template: 'Loading...'
                    })
                    StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                        $ionicLoading.hide();
                        var nStage = StageService.getStage(5);
                        StageService.logTransaction(nStage, 1);
                        RecordService.updateRecord(0, 0, 0);
                        RecordService.updateNotification(record, 5, new Date(), 1);
                        $state.go('hmanagement', { snake: 0, stage: 5, times: 1 }, {reload: true});
                    });
                } else {
                    var nStage = StageService.getStage(73);
                    StageService.logTransaction(nStage, 1)
                    $state.go('identification', {}, {reload: true});
                }
            } else if (record.transaction.stage.stage_num == 73) {
                if ($scope.le_y_class == "button-positive") {
                    var nStage = StageService.getStage(78);
                    StageService.logTransaction(nStage, 1)
                    $state.go('umanagement', { snake: 7, stage: 78, times: 1 }, {reload: true});
                } else {
                    $ionicLoading.show({
                        template: 'Loading...'
                    })
                    StageService.getAllStagesOfSnakeType(0).success(function (stage) {
                        $ionicLoading.hide();
                        var nStage = StageService.getStage(5);
                        StageService.logTransaction(nStage, 1)
                        RecordService.updateRecord(0, 0, 0);
                        RecordService.updateNotification(record, 5, new Date(), 1);
                        $state.go('hmanagement', { snake: 0, stage: 5, times: 1 }, {reload: true});
                    });
                }
            } else if (record.transaction.stage.stage_num == 77) {
                if ($scope.le_y_class == "button-positive") {
                    var nStage = StageService.getStage(74);
                    StageService.logTransaction(nStage, 1);
                    $state.go('identification', {}, {reload: true});
                } else {
                    var nStage = StageService.getStage(170);
                    StageService.logTransaction(nStage, 1);
                    $state.go('identification', {}, {reload: true});
                }
            } else if (record.transaction.stage.stage_num == 74) {
                $ionicLoading.show({
                    template: 'Loading...'
                })
                if ($scope.j_y_class == "button-positive") {
                    StageService.getAllStagesOfSnakeType(4).success(function (stage) {
                        $ionicLoading.hide();
                        var nStage = StageService.getStage(44);
                        StageService.logTransaction(nStage, 1);
                        RecordService.updateRecord(0, 0, 4);
                        RecordService.updateNotification(record, 44, new Date(), 1);
                        $state.go('nmanagement', { snake: 4, stage: 44, times: 1 }, {reload: true});
                    });
                } else {
                    StageService.getAllStagesOfSnakeType(3).success(function (stage) {
                        $ionicLoading.hide();
                        var nStage = StageService.getStage(34);
                        StageService.logTransaction(nStage, 1);
                        RecordService.updateRecord(0, 0, 3);
                        RecordService.updateNotification(record, 34, new Date(), 1);
                        $state.go('nmanagement', { snake: 3, stage: 34, times: 1 }, {reload: true});
                    });
                }
            } else if (record.transaction.stage.stage_num == 170) {
                if ($scope.in_y_class == "button-positive") {
                    $ionicLoading.show({
                        template: 'Loading...'
                    })
                    StageService.getAllStagesOfSnakeType(6).success(function (stage) {
                        $ionicLoading.hide();
                        var nStage = StageService.getStage(62);
                        StageService.logTransaction(nStage, 1);
                        RecordService.updateRecord(0, 0, 6);
                        RecordService.updateNotification(record, 62, new Date(), 1);
                        $state.go('nmanagement', { snake: 6, stage: 62, times: 1 }, {reload: true});
                    });
                } else {
                    var nStage = StageService.getStage(79);
                    StageService.logTransaction(nStage, 1)
                    $state.go('umanagement', { snake: 7, stage: 79, times: 1 }, {reload: true});
                }
            }
        };


    })


    .controller('UManagementCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RecordService, SnakeService, StageService, $timeout) {

        $scope.my.show_h_menu = true;
        $scope.my.show_n_menu = true;
        $scope.my.show_f_menu = true;

        $scope.snake = SnakeService.getSnakeByID($state.params.snake);
        $scope.user = UserService.getUserInfo();
        $scope.patient = UserService.getPatientInfo();
        var record = RecordService.getRecord();
        $scope.record = record;


        var stage = StageService.getStage($state.params.stage);
        $scope.stage = stage;
        if (stage.action_type == "alert") {
            if ((record.notif_datetime == null && record.notif_datetime2 == null)) {
                $scope.times = "ตรวจไปแล้ว 0 ครั้ง"
            } else if (record.transaction.stage.stage_num == 72) {
                var text = "";
                if (record.transaction.times > 0) {
                    var nextCheckText = "";
                    if (record.transaction.times > 1) {
                        nextCheckText = "(ตรวจครั้งสุดท้ายเวลา " + dateTimeFormat(record.transaction.datetime) + ")";
                    }
                    text = "\nตรวจเลือดไปแล้ว " + (record.transaction.times - 1) + " ครั้ง " + nextCheckText;
                }
                if (record.transaction2.times > 0) {
                    var nextCheckText = "";
                    if (record.transaction2.times > 1) {
                        nextCheckText = "(ตรวจครั้งสุดท้ายเวลา " + dateTimeFormat(record.transaction2.datetime) + ")";
                    }
                    text += "\nตรวจกล้ามเนื้ออ่อนแรงไปแล้ว " + (record.transaction2.times - 1) + " ครั้ง " + nextCheckText;
                }
                $scope.times = text;
            } else {
                var nextCheckText = "";
                if ($state.params.times > 1) {
                    nextCheckText = "(ตรวจครั้งสุดท้ายเวลา " + dateTimeFormat(record.transaction.datetime) + ")";
                }
                $scope.times = "ตรวจไปแล้ว " + ($state.params.times - 1) + " ครั้ง " + nextCheckText;
            }
        }

        if (stage.action_type == 'call') {
            $scope.consult_reason = " - " + (record.transaction.consult_reason ? record.transaction.consult_reason : "Emergency case");
        }
        
        $scope.show_skip_n = (stage.relate_to == "motor weakness" || stage.relate_to == "blood test") && stage.stage_num != 75;
        $scope.show_skip_h = stage.relate_to == "motor weakness" || stage.relate_to == "blood test";
        $scope.show_skip_i = stage.action_type == "identification";
        $scope.show_call = stage.action_type == "call";
        //$scope.show_close_case = stage.relate_to == "close";

        if (stage.relate_to == "close" && record.status == "active") {
            RecordService.updateNotifActive(record, 0);
            RecordService.closeCase();
            $timeout(function () {
                var index = 0;
                angular.forEach($scope.activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        index = i;
                        value.notif_active = 0;
                    }   
                });
                $scope.activeRecords.splice(index, 1);
            });
        }

        $scope.skipH = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('patientPUtil', { totest:1 }, {reload: true});
        }

        $scope.skipN = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('patientPUtil', { totest:2 }, {reload: true});
        }

        $scope.skipI = function () {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('identification', {}, {reload: true});
        }

        /*if (record.transaction.stage.stage_num == 72) {
            var stage = StageService.getStage(72);
            $scope.totalCheckTimes1 = [];
            for (var i = 1; i <= stage.times; i++) {
                var item = {};
                item.number = i;
                item.class = $state.params.times - 1 >= i ? "active" : record.notif_times - 1 >= i ? "notif" : "";
                $scope.totalCheckTimes.push(item);
            }
        }*/

        /*$scope.closeCase = function () {
            $timeout(function () {
                RecordService.closeCase($scope.activeRecords);
            });
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('signin');
        };*/

        // update badge
        if (record.notif_stage == record.transaction.stage.stage_num && record.notif_times <= record.transaction.times) {
            if (record.transaction.stage.stage_num == 75) {
                RecordService.updateNotifActive(record, 0);
                $timeout(function () {
                    angular.forEach($scope.activeRecords, function(value, i) {
                        if (value.record_id == record.record_id) {
                            value.notif_active = 0;
                        }   
                    });
                });
            } else if(record.notif_times2 <= record.transaction2.times) {
                RecordService.updateNotifActive(record, 0);
                $timeout(function () {
                    angular.forEach($scope.activeRecords, function(value, i) {
                        if (value.record_id == record.record_id) {
                            value.notif_active = 0;
                        }   
                    });
                });
            }
        }

    })

    .controller('FlowchartCtrl', function ($scope, $state, StageService) {
        var stage = StageService.getStage($state.params.stage);
        var imageN = stage.image;
        if ($state.params.stage == 4) {
            if ($state.params.snake == 1) {
                imageN = 14;
            } else if ($state.params.snake == 2) {
                imageN = 24;
            } else if ($state.params.snake == 3) {
                imageN = 35;
            } else if ($state.params.snake == 4) {
                imageN = 45;
            } else if ($state.params.snake == 5) {
                imageN = 52;
            } else if ($state.params.snake == 6) {
                imageN = 62;
            } else if ($state.params.snake == 7) {
                imageN = 80;
            } 
        } else if ($state.params.stage == 36) {
            if ($state.params.snake == 0) {
                imageN = 6;
            } else if ($state.params.snake == 1) {
                imageN = 16;
            } else if ($state.params.snake == 2) {
                imageN = 26;
            } else if ($state.params.snake == 4) {
                imageN = 46;
            } else if ($state.params.snake == 5) {
                imageN = 53;
            } else if ($state.params.snake == 6) {
                imageN = 63;
            } else if ($state.params.snake == 7) {
                imageN = 171;
            }
        }
        var stage = StageService.getStage($state.params.stage);
        $scope.stageImage = "img/stage/stage" + imageN + ".jpg"
    })

    .controller('GeneralInfoCtrl', function ($scope, $state, StageService, $sce) {
        if ($state.params.type == 'anaphylaxis') {
            $scope.title = "Management for anaphylaxis";
            $scope.info = $sce.trustAsHtml("<ul style='list-style: circle;-webkit-padding-start: 1em;'>" +
                            "<li>On IV isotonic fluid</li>" +
                            "<li>Epinephrine: (1:1,000) 0.3-0.5ml IM (0.01ml/kg for pediatric)</li>" +
                            "<li>Antihistamine (H1 Blocker): CPM (10mg) 1amp IV q 8h (0.35 mg/kg/day in divided doses q 4 - 6 hr for pediatric)</li>" +
                            "<li>Antihistamine (H2 Blocker): Ranitidine 50 mg IV q 8h (3 mg/kg/day in divided doses q 8 hr for pediatric)</li>" +
                            "<li>Corticosteroid: Dexamethasone 5-10mg IV q 8h (2mg/kg/day divided doses q 6-8hr for pediatric)</li>" +
                            "<li>Bronchodilator</li>" +
                            "<li>Oxygen supplement</li>" +
                          "</ul>");
        } else if ($state.params.type == 'wound') {
            $scope.title = "Wound care";
            $scope.info = $sce.trustAsHtml("<ol style='list-style: decimal;-webkit-padding-start: 1em;'>" +
                            "<li>ยกแขนหรือขาที่ถูกกัดสูงกว่าระดับหัวใจ</li>" +
                            "<li>ไม่จำเป็นต้องให้ antibiotics ยกเว้นมี sign of infection</li>" +
                            "<li>หากจำเป็นต้อง debride แผล → consult PC</li>" +
                            "<li>หากแผลปวดบวมมากขึ้นเยอะ → อาจพิจารณา consult PC</li>" +
                            "<li>ให้ tetanus prophylaxis</li>" +
                            "<ul style='list-style: circle;-webkit-padding-start: 1em;'>" +
                                "<li>ในงู hematotoxin ให้เมื่อ Done</li>" +
                                "<li>ในงู neurotoxin ให้ได้ทันที</li>" +
                                "<li>ในงูไม่ทราบชนิดให้เมื่อ Done</li>" +
                            "</ul>" +
                          "</ol>");
        } 
    })

function checkNotification(RecordService, timeout, ionicPopup, UserService, ionicHistory, state, scope, cordovaNotif, interval) {
    scope.preventClick = "click-block";
    RecordService.getAllActiveRecords().success(function (activeRecords) {
        angular.forEach(activeRecords, function(record, index) {
            if (record.notif_stage != 0 && record.transaction.stage.action_type == "alert") {
                var lastNotifTime = new Date(record.notif_datetime).getTime();
                var frequent = ((record.transaction.stage.frequent / divide) * 1000)
                var now = new Date().getTime();
                var alertText = "ตรวจกล้ามเนื้ออ่อนแรง";
                if (record.transaction.stage.relate_to == "blood test") {
                    alertText = "ตรวจเลือด";
                }
                if ((record.transaction.stage.frequent == 86400 &&
                        record.notif_times > 1 && (lastNotifTime + frequent) <= now && record.notif_times <= record.transaction.stage.times) ||
                    (record.transaction.stage.frequent != 86400 && 
                        (lastNotifTime + frequent) <= now && record.notif_times <= record.transaction.stage.times)) {
                    var confirmPopup = ionicPopup.confirm({
                        title: alertText,
                        template: "<b>ครั้งที่ " + record.notif_times + "</b><br>" +
                            record.patient.patient_name + "<br>" +
                            dateShortFormat(new Date(record.incident_date)) + " " + record.incident_time + "<br>" + 
                            record.snake.snake_thai_name
                    });

                    confirmPopup.then(function(res) {
                        if(res) {
                            UserService.setCurrentPatient(record.patient);
                            RecordService.getRecordOfPatient();
                            ionicHistory.nextViewOptions({
                                historyRoot: true
                            });
                            state.go('patientPUtil', { totest:1 }, {reload: true});
                        }
                    });

                    if (window.cordova) {
                        var option = {
                            id: record.record_id + "000" + record.transaction.stage.stage_num,// + "0" + record.notif_times,
                            title: alertText + "  ครั้งที่ " + record.notif_times,
                            text: record.patient.patient_name + "\n" +
                                dateShortFormat(new Date(record.incident_date)) + " " + record.incident_time + "\n" + 
                                record.snake.snake_thai_name,
                            sound: null,
                            data: {patient: record.patient, totest: 1}
                            //badge: 1
                        };
                        cordovaNotif.schedule(option).then(function () {
                            //alert("notification add")
                        });
                    }

                    // update badge
                    timeout(function () {
                        angular.forEach(scope.activeRecords, function(value, i) {
                            if (value.record_id == record.record_id) {
                                value.notif_active = 1;
                            }   
                        });
                    });

                    RecordService.updateNotifActive(record, 1);
                    RecordService.updateNotification(record, record.transaction.stage.stage_num, new Date(lastNotifTime + frequent), (record.notif_times + 1));
                    
                }
            }
            if (record.notif_datetime2 != null && record.transaction2 != null) {
                var lastNotifTime = new Date(record.notif_datetime2).getTime();
                var frequent = ((record.transaction2.stage.frequent / divide) * 1000)
                var now = new Date().getTime();
                if ((lastNotifTime + frequent) <= now && record.notif_times2 <= record.transaction2.stage.times) {
                    var confirmPopup = ionicPopup.confirm({
                        title: "ตรวจกล้ามเนื้ออ่อนแรง",
                        template: "<b>ครั้งที่ " + record.notif_times2 + "</b><br>" +
                            record.patient.patient_name + "<br>" +
                            dateShortFormat(new Date(record.incident_date)) + " " + record.incident_time + "<br>" + 
                            record.snake.snake_thai_name
                    });

                    confirmPopup.then(function(res) {
                        if(res) {
                            UserService.setCurrentPatient(record.patient);
                            RecordService.getRecordOfPatient();
                            ionicHistory.nextViewOptions({
                                historyRoot: true
                            });
                            state.go('patientPUtil', { totest:2 }, {reload: true});
                        }
                    });

                    if (window.cordova) {
                        var option = {
                            id: record.record_id + "000" + record.transaction2.stage.stage_num,// + "0" + record.notif_times2,
                            title: "ตรวจกล้ามเนื้ออ่อนแรง  ครั้งที่ " + record.notif_times2,
                            text: record.patient.patient_name + "\n" +
                                dateShortFormat(new Date(record.incident_date)) + " " + record.incident_time + "\n" + 
                                record.snake.snake_thai_name,
                            sound: null,
                            data: {patient: record.patient, totest: 2}
                            //badge: 1
                        };
                        cordovaNotif.schedule(option).then(function () {
                            //alert("notification add")
                        });
                    }

                    // update badge
                    timeout(function () {
                        angular.forEach(scope.activeRecords, function(value, i) {
                            if (value.record_id == record.record_id) {
                                value.notif_active = 1;
                            }   
                        });
                    });

                    RecordService.updateNotifActive(record, 1);
                    RecordService.updateNotification2(record, new Date(lastNotifTime + frequent), (record.notif_times2 + 1));
                }
            }
        });
        scope.preventClick = "";
    }).error(function () {
        ionicPopup.alert({
            title: 'Network error!!!',
            template: "Please check your internet connection and then try again later"
        });
        scope.preventClick = "";
        interval.cancel(runNotificaion);
        interval.cancel(checkConnection);
        if (window.cordova) {
            cordova.plugins.notification.local.cancelAll();
        }
        ionicHistory.nextViewOptions({
            historyRoot: true
        });
        state.go('home');
    });
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

function getBirthdateFromAge(year, month, date) {
    var bd = new Date();
    bd.setDate(bd.getDate() - date);
    bd.setMonth(bd.getMonth() - month);
    bd.setYear(bd.getFullYear() - year);
    return bd;
}

function getAge(birthdate) {
    var ageOb = {}
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
    ageOb.year = yeardiff;
    ageOb.month = monthdiff;
    ageOb.day = datediff;
    return ageOb;
}

function dateTimeFormat(date) {
    var month = (date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);    
    var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate(); 
    var hour = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours(); 
    var minute = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
    var second = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();
    return date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;      
}