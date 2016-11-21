//var user = {user_id: 1, physician_name: "Varunya Thavornun", hospital: {hospital_name: "Ram", hospital_province: "BKK"}};
//var patient = {patient_id: 1, patient_name: "kkk", patient_gender: "Female", patient_birthdate: "10/04/1980"};

var user = {};
var patient = {};
var activeRecords = [];
var closedRecords = [];
var record = {};
var snakes = [];

angular.module('snakeEnvenomation.services', [])

    .factory('UserService', function ($q, $http, $cookies) {

        return {
            register: function (user) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http({
                    url: api_host_url + "/register",
                    method: "POST",
                    data: user,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status, headers, config) {
                        deferred.resolve();
                    })
                    .error(function (data, status, headers, config, statusText) {
                        deferred.reject(data);
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
            activate: function (id) {
                $http.put(api_host_url + "/activate/" + id);
            },
            resendMail: function (email) {
                $http.post(api_host_url + "/resendmail?email=" + email);
            },
            loginUser: function (email, password) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/login?email=" + email)
                    .success(function (data, status, headers, config) {
                        if (data.physician.password != password) {
                            deferred.reject({status:1, message:"Wrong password!"});
                        } else if (!data.physician.is_activate) {
                            deferred.reject({status:2, message:"Your account hasn't been activated. " + 
                                    "We sent you a confirmation email with a link to activate your account." + 
                                    "Please check your email and click the link before you can login to the system. "});
                        } else {
                            user = data.physician;
                            deferred.resolve(user);
                        }
                    })
                    .error(function (data, status, headers, config, statusText) {
                        deferred.reject({status:status, message:""});
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
                user = $cookies.getObject('user');
                return user;
            },
            getPatientInfo: function () {
                return patient;
            },
            getPatientInfoById: function (id) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/patient?id=" + id)
                    .success(function (data, status, headers, config) {
                        deferred.resolve(data);
                    })
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                return promise;
            },
            updateUserInfo: function (entry) {
                user.hospital_name = entry.hospital_name;
                user.hospital_province = entry.hospital_province;
                var expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + 1);
                $cookies.putObject('user', user, {'expires': expireDate});
                $http.put(api_host_url + "/physician/" + user.user_id + "?"
                    + "hospital_name=" + user.hospital_name
                    + "&hospital_province=" + user.hospital_province);
            },
            updatePatientInfo: function (entry, birthdate) {
                var deferred = $q.defer();
                var promise = deferred.promise;

                patient.patient_national_id = entry.patient_national_id;
                patient.patient_name = entry.patient_name;
                patient.patient_gender = entry.patient_gender;
                patient.patient_birthdate = dateShortFormat(birthdate);
                $http.post(api_host_url + "/patient?"
                    + "patient_national_id=" + patient.patient_national_id
                    + "&patient_name=" + patient.patient_name
                    + "&patient_gender=" + patient.patient_gender
                    + "&patient_birthdate=" + dateShortFormat(birthdate))
                .success(function (data, status, headers, config) {
                    patient.patient_id = data.patient_id
                    deferred.resolve();
                })
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                return promise;
            },
            setCurrentPatient: function (currentPatient) {
                patient = currentPatient;
            },
            logout: function() {
                $cookies.remove('user');
                user = {};
                patient = {};
                activeRecords = [];
                closedRecords = [];
                record = {};
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
                        var promises = activeRecords.map(function(record) {
                            return new Promise(function(resolve, reject) {
                                record.snake = snakes[record.snake_type]
                                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/current-stage")
                                    .success(function (data, status, headers, config) {
                                        if (data.transaction_times) {
                                            if (data.stage_num == 71) {
                                                record.transaction2 = {};
                                                record.transaction2.stage = data;
                                                record.transaction2.times = data.transaction_times;
                                                record.transaction2.datetime = new Date(data.transaction_datetime);

                                                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/current-stage/72")
                                                    .success(function (data2, status, headers, config) {
                                                        if (data2.transaction_times) {
                                                            record.transaction = {};
                                                            record.transaction.stage = data2;
                                                            record.transaction.times = data2.transaction_times;
                                                            record.transaction.datetime = new Date(data2.transaction_datetime);
                                                        } else {
                                                            record.transaction = null;
                                                        }
                                                        resolve();
                                                    });
                                            } else if (data.stage_num == 72) {
                                                record.transaction = {};
                                                record.transaction.stage = data;
                                                record.transaction.times = data.transaction_times;
                                                record.transaction.datetime = new Date(data.transaction_datetime);
                                                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/current-stage/71")
                                                    .success(function (data2, status, headers, config) {
                                                        if (data2.transaction_times) {
                                                            record.transaction2 = {};
                                                            record.transaction2.stage = data2;
                                                            record.transaction2.times = data2.transaction_times;
                                                            record.transaction2.datetime = new Date(data2.transaction_datetime);
                                                        } else {
                                                            record.transaction2 = null;
                                                        }
                                                        resolve();
                                                    });
                                            } else {
                                                record.transaction = {};
                                                record.transaction.stage = data;
                                                record.transaction.times = data.transaction_times;
                                                record.transaction.datetime = new Date(data.transaction_datetime);
                                                resolve();
                                            }
                                        } else {
                                            record.transaction = null;
                                            resolve();
                                        }
                                    });
                            });
                        });   
                        Promise.all(promises)
                            .then(function() { deferred.resolve(activeRecords); })
                            .catch(console.error);
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
            getAllClosedRecords: function () {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/treatment-record/close?user_id=" + user.user_id)
                    .success(function (data, status, headers, config) {
                        closedRecords = data;
                        var promises = closedRecords.map(function(record) {
                            return new Promise(function(resolve, reject) {
                                record.snake = snakes[record.snake_type]
                                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/current-stage")
                                    .success(function (data, status, headers, config) {
                                        record.transaction = {};
                                        record.transaction.stage = data;
                                        record.transaction.times = data.transaction_times;
                                        record.transaction.datetime = new Date(data.transaction_datetime);
                                        record.transaction.consult_reason = data.consult_reason;
                                        resolve();
                                    });
                            });
                        });   
                        Promise.all(promises)
                            .then(function() { deferred.resolve(closedRecords); })
                            .catch(console.error);
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
            getStaticClosedRecords:function() {
                return closedRecords;
            },
            getRecordOfPatient: function () {
                var flag = false;
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
            isRecordOfPatientExisting: function (id) {
                var flag = false;
                angular.forEach(activeRecords, function(value, index) {
                    if (value.patient.patient_national_id == id) {
                        flag = true;
                    }   
                });
                return flag;
            },
            getClosedRecordOfRecordId: function (record_id) {
                var flag = false;
                angular.forEach(closedRecords, function(value, index) {
                    if (value.record_id == record_id) {
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
                record.incident_date = dateShortFormat(incident.incident_date);
                record.incident_time = timeFormat(incident.incident_time)
                record.incident_district = incident.incident_district === undefined ? "" : incident.incident_district;
                record.incident_province = incident.incident_province === undefined ? "" : incident.incident_province;
                record.status = "active";

                activeRecords.push(record);
                
                /*var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                angular.forEach(monthNames, function(value, index) {
                    if (incident.incident_date.indexOf(value) > -1) {
                        month = (index + 1 < 10) ? "0" + (index + 1) : (index + 1)
                    }   
                });
                var formatDate = incident.incident_date.substr(incident.incident_date.length - 4) + "-" + month + "-" + incident.incident_date.substr(0, 2);*/

                var deferred = $q.defer();
                var promise = deferred.promise;

                $http.post(api_host_url + "/treatment-record?"
                    + "user_id=" + user.user_id
                    + "&patient_id=" + patient.patient_id
                    + "&incident_date=" + dateShortFormat(incident.incident_date)
                    + "&incident_time=" + timeFormat(incident.incident_time)
                    + "&incident_district=" + (incident.incident_district === undefined ? "" : incident.incident_district)
                    + "&incident_province=" + (incident.incident_province === undefined ? "" : incident.incident_province))
                    .success(function (data, status, headers, config) {
                        record.record_id = data.record_id;
                        deferred.resolve(record);
                    })
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                return promise;
            },
            getRecord: function () {
                return record;
            },
            updateRecord: function (bleeding, resFail, snakeType) {
                record.systemic_bleeding = bleeding ? 1 : 0;
                record.respiratory_failure = resFail ? 1 : 0;
                record.snake_type = snakeType;
                record.snake = snakes[snakeType]
                
                $http.put(api_host_url + "/treatment-record/" + record.record_id + "?"
                    + "systemic_bleeding=" + (bleeding ? 1 : 0)
                    + "&respiratory_failure=" + (resFail ? 1 : 0)
                    + "&snake_type=" + snakeType);
            },
            updateUnknownFields: function (ar, le, indoor, jaw) {
                record.acute_renal_failure = ar ? 1 : 0;
                record.local_edema = le ? 1 : 0;
                record.indoor = indoor ? 1 : 0;
                record.locked_jaw = jaw ? 1 : 0
                
                $http.put(api_host_url + "/treatment-record/" + record.record_id + "?"
                    + "acute_renal_failure=" + (ar ? 1 : 0)
                    + "&local_edema=" + (le ? 1 : 0)
                    + "&indoor=" + (indoor ? 1 : 0)
                    + "&locked_jaw=" + (jaw ? 1 : 0));
            },
            updateNotification: function(rec, stage, datetime, times) {
                angular.forEach(activeRecords, function(value, index) {
                    if (value.record_id == rec.record_id) {
                        value.notif_stage = stage;
                        value.notif_datetime = datetime;
                        value.notif_times = times;
                    }   
                });
                if (rec.record_id == record.record_id) {
                    record.notif_stage = stage;
                    record.notif_datetime = datetime;
                    record.notif_times = times;
                }
                
                $http.put(api_host_url + "/treatment-record/" + rec.record_id + "?"
                    + "notif_stage=" + stage
                    + "&notif_datetime=" + dateTimeFormat(datetime)
                    + "&notif_times=" + times);
            },
            updateNotification2: function(rec, datetime, times) {
                angular.forEach(activeRecords, function(value, index) {
                    if (value.record_id == rec.record_id) {
                        value.notif_datetime2 = datetime;
                        value.notif_times2 = times;
                    }   
                });
                if (rec.record_id == record.record_id) {
                    record.notif_datetime2 = datetime;
                    record.notif_times2 = times;
                }
                
                $http.put(api_host_url + "/treatment-record/" + rec.record_id + "?"
                    + "notif_datetime2=" + dateTimeFormat(datetime)
                    + "&notif_times2=" + times);
            },
            setnullNotif: function() {
                $http.put(api_host_url + "/treatment-record/" + record.record_id + "/setnull_notif");
            },
            setnullNotif2: function() {
                $http.put(api_host_url + "/treatment-record/" + record.record_id + "/setnull_notif2");
            },
            updateNotifActive: function(rec, isActive) {
                angular.forEach(activeRecords, function(value, index) {
                    if (value.record_id == rec.record_id) {
                        value.notif_active = isActive;
                    }   
                });
                if (rec.record_id == record.record_id) {
                    record.notif_active = isActive;
                }
                
                $http.put(api_host_url + "/treatment-record/" + rec.record_id + "?"
                    + "notif_active=" + isActive);
            },
            closeCase: function () {
                record.status = "closed";
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/closed");
                var index = 0;
                angular.forEach(activeRecords, function(value, i) {
                    if (value.record_id == record.record_id) {
                        index = i
                    }   
                });
                activeRecords.splice(index, 1);

                closedRecords.push(record);
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
                                value.imgs = value.snake_images_url.split(",");
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
            addBloodTest: function (bloodTest, stage, times, isEdited) {     
                bloodTest.stage = stage;
                bloodTest.stage_times = times;
                bloodTest.date_time = dateTimeFormat(new Date());
                bloodTest.is_edited = isEdited;
                delete bloodTest["action_text"];
                delete bloodTest["record_id"];
                delete bloodTest["test_id"];
                bloodTests.push(bloodTest)
                $http({
                    url: api_host_url + "/treatment-record/" + record.record_id + "/blood-tests",
                    method: "POST",
                    data: bloodTest,
                    headers: {'Content-Type': 'application/json'}
                })
            },
            getBloodTests: function () {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/blood-tests")
                    .success(function (data, status, headers, config) {
                        bloodTests = data;
                        angular.forEach(bloodTests, function(value, index) {     
                            value.date_time = dateTimeFormat(new Date(value.date_time));
                        })
                        deferred.resolve(bloodTests);
                    });
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                return promise;
            },
            getLatestBloodTest: function () {
                if (bloodTests.length > 0) {
                    return bloodTests[bloodTests.length - 1]
                } else {
                    return null;
                }
            },
            getBloodTestById: function (id) {
                var test = null;
                angular.forEach(bloodTests, function(value, index) {   
                    if (value.test_id == id) {
                        test = value
                    }
                })
                return test;
            }
        }
    })
    
    .factory('MotorWeaknessService', function ($q, $http) {

        var motorWeaknesses = [];

        return {
            addMotorWeakness: function (weakness, progression, stage, times, isEdited) {   
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/weakness-tests?"
                    + "date_time=" + dateTimeFormat(new Date())
                    + "&stage=" + stage
                    + "&stage_times=" + times
                    + "&is_edited=" + isEdited
                    + "&motor_weakness=" + weakness
                    + (progression != null ? "&progression=" + progression : ""));
            },
            getMotorWeaknesses: function () {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/treatment-record/" + record.record_id + "/weakness-tests")
                    .success(function (data, status, headers, config) {
                        motorWeaknesses = data;
                        angular.forEach(motorWeaknesses, function(value, index) {     
                            value.date_time = dateTimeFormat(new Date(value.date_time));
                        })
                        deferred.resolve(motorWeaknesses);
                    });
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                return promise;
            },
            getLatestMotorWeakness: function () {
                return motorWeaknesses[motorWeaknesses.length - 1]
            },
            getMotorWeaknessById: function (id) {
                var test = null;
                angular.forEach(motorWeaknesses, function(value, index) {   
                    if (value.test_id == id) {
                        test = value
                    }
                })
                return test;
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
                var now = new Date()
                record.transaction.datetime = now;
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/transaction?"
                    + "stage_num=" + stage.stage_num
                    + "&times=" + times
                    + "&date_time=" + dateTimeFormat(now))
            },
            logTransaction2: function(stage, times) {
                record.transaction2 = {};
                record.transaction2.stage = stage;
                record.transaction2.times = times;
                var now = new Date()
                record.transaction2.datetime = now;
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/transaction?"
                    + "stage_num=" + stage.stage_num
                    + "&times=" + times
                    + "&date_time=" + dateTimeFormat(now))
            },
            updateTransactionPCReason: function(stage, times, consult_reason) {
                record.transaction = {};
                record.transaction.stage = stage;
                record.transaction.times = times;
                var now = new Date()
                record.transaction.datetime = now;
                record.transaction.consult_reason = consult_reason;
                $http.post(api_host_url + "/treatment-record/" + record.record_id + "/transaction?"
                    + "stage_num=" + stage.stage_num
                    + "&times=" + times
                    + "&date_time=" + dateTimeFormat(now)
                    + "&consult_reason=" + consult_reason)
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
                            if (data[value.indicator] >= value.value)
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

    function dateShortFormat(date) {
        var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        var month = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
        return date.getFullYear() + "-" + month + "-" + day;
    }

    function timeFormat(date) {
        var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        return date.getHours() + ":" + minute
    }