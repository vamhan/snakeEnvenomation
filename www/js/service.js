//var user = {user_id: 1, physician_name: "Varunya Thavornun", hospital: {hospital_name: "Ram", hospital_province: "BKK"}};
//var patient = {patient_id: 1, patient_name: "kkk", patient_gender: "Female", patient_birthdate: "10/04/1980"};

var user = {};
var patient = {};
var activeRecords = [];
var record = {};
var snakes = [];


//var api_host_url = "http://localhost:9080/snake-envenomation/api"
var api_host_url = "http://cdss.topwork.asia:9080/snake-envenomation/api"

angular.module('snakeEnvenomation.services', [])

    .factory('UserService', function ($q, $http) {

        return {
            loginUser: function (username, patientId) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/login?username=" + username + "&patient_national_id=" + patientId)
                    .success(function (data, status, headers, config) {
                        user = data.physician;
                        patient = data.patient;
                        user["username"] = username;
                        patient["patient_national_id"] = patientId;
                        deferred.resolve();
                    })
                    .error(function (data, status, headers, config, statusText) {
                        alert(status + " " + statusText)
                        deferred.reject(statusText);
                    });
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getUserInfo: function () {
                return user;
            },
            getPatientInfo: function () {
                return patient;
            },
            updateUserInfo: function (entry) {
                user.physician_name = entry.physician_name;
                user.hospital_name = entry.hospital_name;
                user.hospital_province = entry.hospital_province;
                $http.put(api_host_url + "/physician/" + user.user_id + "?"
                    + "physician_name=" + user.physician_name
                    + "&hospital_name=" + user.hospital_name
                    + "&hospital_province=" + user.hospital_province);
            },
            updatePatientInfo: function (entry) {
                patient.patient_name = entry.patient_name;
                patient.patient_gender = entry.patient_gender;
                patient.patient_birthdate = entry.patient_birthdate;
                var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                angular.forEach(monthNames, function(value, index) {
                    if (patient.patient_birthdate.indexOf(value) > -1) {
                        month = (index + 1 < 10) ? "0" + (index + 1) : (index + 1)
                    }   
                });
                var formatDate = patient.patient_birthdate.substr(patient.patient_birthdate.length - 4) + "-" + month + "-" + patient.patient_birthdate.substr(0, 2);
                $http.put(api_host_url + "/patient/" + patient.patient_id + "?"
                    + "patient_name=" + patient.patient_name
                    + "&patient_gender=" + patient.patient_gender
                    + "&patient_birthdate=" + formatDate);
            },
            setCurrentPatient: function (currentPatient) {
                patient = currentPatient;
            }
        }
    })

    .factory('RecordService', function ($q, $http) {

        return {
            getAllActiveRecords: function () {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/treatment-record/active?user_id=" + user.user_id)
                    .success(function (data, status, headers, config) {
                        activeRecords = data;
                        angular.forEach(activeRecords, function(record, index) {
                            record["snake"] = snakes[record.snake_type]
                            $http.get(api_host_url + "/treatment-record/" + record.record_id + "/current-stage")
                                .success(function (data, status, headers, config) {
                                    if (data.transaction_times) {
                                        record.transaction = {};
                                        record.transaction.stage = data;
                                        record.transaction.times = data.transaction_times;
                                        deferred.resolve(activeRecords);
                                    } else {
                                        record.transaction = null;
                                    }
                                });
                        });
                        deferred.resolve(activeRecords);
                    });
                    
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getRecordOfPatient: function () {
                var flag = false
                angular.forEach(activeRecords, function(value, index) {
                    if (value.patient_id == patient.patient_id) {
                        record = value;
                        flag = true;
                    }   
                });
                if (!flag) {
                    record = {};
                }
                return record;
            },
            addRecord: function (incident) {
                record.user_id = user.user_id;
                record.patient_id = patient.patient_id;
                record.patient = patient;
                record.incident_date = incident.incident_date;
                record.incident_time = incident.incident_time;
                record.incident_district = incident.incident_district;
                record.incident_province = incident.incident_province;
                
                var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                angular.forEach(monthNames, function(value, index) {
                    if (incident.incident_date.indexOf(value) > -1) {
                        month = (index + 1 < 10) ? "0" + (index + 1) : (index + 1)
                    }   
                });
                var formatDate = incident.incident_date.substr(incident.incident_date.length - 4) + "-" + month + "-" + incident.incident_date.substr(0, 2);
                
                $http.post(api_host_url + "/treatment-record?"
                    + "user_id=" + user.user_id
                    + "&patient_id=" + patient.patient_id
                    + "&incident_date=" + formatDate
                    + "&incident_time=" + incident.incident_time
                    + "&incident_district=" + incident.incident_district
                    + "&incident_province=" + incident.incident_province)
                    .success(function (data, status, headers, config) {
                        record.record_id = data.record_id;
                    })
                
                if (activeRecords.indexOf(record) < 0) {    
                    activeRecords.push(record);
                }
                return activeRecords;
            },
            getRecord: function () {
                return record;
            },
            updateRecord: function (bleeding, resFail, snakeType) {
                record.systemic_bleeding = bleeding;
                record.respiratory_failure = resFail;
                record.snake_type = snakeType;
                record.snake = snakes[record.snake_type]
                
                $http.put(api_host_url + "/treatment-record/" + record.record_id + "?"
                    + "systemic_bleeding=" + (bleeding ? 1 : 0)
                    + "&respiratory_failure=" + (resFail ? 1 : 0)
                    + "&snake_type=" + snakeType);
            },
            closeCase: function () {
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/closed");
                var index = 0;
                angular.forEach(activeRecords, function(value, i) {
                    if (value === record) {
                        index = i
                    }   
                });
                activeRecords.splice(index, 1);
                return activeRecords
            }
        }
    })

    .factory('SnakeService', function ($q, $http) {

        return {
            getAllSnakes: function () {
                var deferred = $q.defer();
                var promise = deferred.promise;
                if (snakes.length > 0) {
                    deferred.resolve(snakes);
                } else {
                    $http.get(api_host_url + "/snakes")
                        .success(function (data, status, headers, config) {
                            snakes = data;
                            angular.forEach(snakes, function (value, key) {
                                value["imgs"] = value.snake_images_url.split(",");
                            });
                            deferred.resolve(snakes);
                        })
                        .error(function (data, status, headers, config) {
                            deferred.reject(status);
                        });
                }
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getSnakeByID: function (snakeId) {
                return snakes[snakeId]
            }
        }
    })

    .factory('BloodTestService', function ($q, $http) {

        var bloodTests = [];

        return {
            addBloodTest: function (bloodTest) {     
                bloodTest["date_time"] = dateTimeFormat(new Date());
                bloodTests.push(bloodTest)
                /*$http({
                    url: api_host_url + "/treatment-record/" + record.record_id + "/blood-tests",
                    method: "POST",
                    data: bloodTest,
                    headers: {'Content-Type': 'application/json'}
                })*/
            },
            getBloodTests: function () {
                if (bloodTests.length > 0) {
                    return bloodTests;
                } else {
                    $http.get(api_host_url + "/treatment-record/" + record.record_id + "/blood-tests")
                        .success(function (data, status, headers, config) {
                            bloodTests = data;
                            angular.forEach(bloodTests, function(value, index) {     
                                value["date_time"] = dateTimeFormat(new Date(value.date_time));
                            })
                        });
                }
            },
            getLatestBloodTest: function () {
                return bloodTests[bloodTests.length - 1]
            }
        }
    })
    
    .factory('MotorWeaknessService', function ($q, $http) {

        var motorWeaknesses = [];

        return {
            addMotorWeakness: function (value) {   
                var date = dateTimeFormat(new Date());
                var motorWeakness = {};
                motorWeakness["date_time"] = date;
                motorWeakness["motor_weakness"] = value;
                motorWeaknesses.push(motorWeakness);
                /*$http.post(api_host_url + "/treatment-record/" + record.record_id + "/weakness-tests?"
                    + "date_time=" + date
                    + "&motor_weakness=" + motorWeakness);*/
            },
            getMotorWeaknesses: function () {
                if (motorWeaknesses.length > 0) {
                    return motorWeaknesses;
                } else {
                    $http.get(api_host_url + "/treatment-record/" + record.record_id + "/weakness-tests")
                        .success(function (data, status, headers, config) {
                            motorWeaknesses = data;
                            angular.forEach(motorWeaknesses, function(value, index) {     
                                value["date_time"] = dateTimeFormat(new Date(value.date_time));
                            })
                        });
                }
            },
            getLatestMotorWeakness: function () {
                return motorWeaknesses[motorWeaknesses.length - 1]
            }
        }
    })

    .factory('StageService', function ($q, $http) {

        var stages = [];

        return {
            getAllStagesOfSnakeType: function(snake_type) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/snakes/" + snake_type + "/stages")
                    .success(function (data, status, headers, config) {
                        stages = data;
                        deferred.resolve(stages[0]);
                    })
                    .error(function (data, status, headers, config) {
                        deferred.reject(status);
                    });
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getStage: function (stage_num) {
                var stage;
                angular.forEach(stages, function (value, key) {
                    if (stages[key].stage_num == stage_num) {
                        stage = stages[key];
                    }
                });
                return stage;
            },
            logTransaction: function(stage, times) {
                record.transaction = {};
                record.transaction.stage = stage;
                record.transaction.times = times;
                /*$http.post(api_host_url + "/treatment-record/" + record.record_id + "/transaction?"
                    + "stage_num=" + stage.stage_num
                    + "&times=" + times
                    + "&date_time=" + dateTimeFormat(new Date()))*/
            },
            updateTransaction: function(action) {
                record.transaction.action = action;
            },
            updateTransactionOfPatient: function(patient, action) {
                angular.forEach(activeRecords, function(value, index) {
                    if (value.patient_id == patient.patient_id) {
                        value.transaction.action = action;
                    }   
                });
            },
            checkCondition: function (stage, data, times) {
                var nextStage = 0
                var pass = false;
                angular.forEach(stage.condition, function (value, key) {
                    switch (value.compare) {
                        case 'lt':
                            if (data[value.indicator] < value.value)
                                pass = true;
                            break;
                        case 'gt':
                            if (data[value.indicator] > value.value)
                                pass = true;
                            break;
                        default:
                            if (data[value.indicator] == value.value)
                                pass = true;
                            break;
                    }
                    if (pass && value.next_yes_stage != null) {
                        nextStage = value.next_yes_stage
                    }
                });
                if (pass && nextStage == 0) {
                    nextStage = stage.next_yes_stage;
                } else if (nextStage == 0) {
                   if (times >= stage.times) {
                        nextStage = stage.next_no_stage;
                    } else {
                        nextStage = stage.stage_num // still in the same stage if test isn't completed
                        times += 1;
                    } 
                }
                return nextStage;
            }
        }
    })
    
    
    function dateTimeFormat(date) {
        var month = (date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);    
        var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate(); 
        var hour = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours(); 
        var minute = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
        var second = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();
        return date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;      
    }