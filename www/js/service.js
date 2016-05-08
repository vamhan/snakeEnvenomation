//var user = {user_id: 1, physician_name: "Varunya Thavornun", hospital: {hospital_name: "Ram", hospital_province: "BKK"}};
//var patient = {patient_id: 1, patient_name: "kkk", patient_gender: "Female", patient_birthdate: "10/04/1980"};

var user = {};
var patient = {};
var activeRecords = [];
var record = {};
var snakes = [];


//var api_host_url = "http://localhost:9080/snake-envenomation/api"
var api_host_url = "http://cdss.topwork.asia:9080/snake-envenomation/api"

angular.module('snakeEnvenomation.services', ['angular-md5'])

    .factory('UserService', function ($q, $http, md5) {

        return {
            loginUser: function (username, patientId) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/login?username=" + md5.createHash(username || '') + "&patient_national_id=" + md5.createHash(patientId || ''))
                    .success(function (data, status, headers, config) {
                        user = data.physician;
                        patient = data.patient;
                        user["username"] = username;
                        patient["patient_national_id"] = patientId;
                        deferred.resolve();
                    })
                    .error(function (data, status, headers, config, statusText) {
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

        /*var stages = [
            {
                stage_num: 1,
                action_text: "CBC, PT, INR, 20 min WBCT, BUN, Creatinine, UA",
                frequent: 0,
                times: 1,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 5,
                next_no_stage: 2,
                action_type: "none",
                relate_to: "blood test"
            },
            {
                stage_num: 2,
                action_text: "CBC, PT, INR, 20 min WBCT q 6 hr for 2 times (6, 12)",
                frequent: 6,
                times: 2,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 5,
                next_no_stage: 3,
                action_type: "alert",
                relate_to: "blood test"
            },
            {
                stage_num: 3,
                action_text: "D/C CBC, PT, INR, 20 min WBCT, Creatinine Once daily for 3 days (24 - 36, 48 - 60, 72 - 84)",
                frequent: 24,
                times: 3,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 5,
                next_no_stage: 4,
                action_type: "alert",
                relate_to: "blood test"
            },
            {
                stage_num: 4,
                action_text: "Done + tetanus prophylaxis",
                frequent: 0,
                times: 1,
                condition: [],
                next_yes_stage: 0,
                next_no_stage: 0,
                action_type: "none",
                relate_to: "none"
            },
            {
                stage_num: 5,
                action_text: "Activenom for Russell Viper 5 vials. Repeat CBC, PT, INR, 20 min WBCT q 4 hr for 3 times",
                frequent: 4,
                times: 3,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 6,
                next_no_stage: 3,
                action_type: "alert",
                relate_to: "blood test"
            },
            {
                stage_num: 6,
                action_text: "Activenom for Russel Viper 5 vials. Consult PC",
                frequent: 0,
                times: 1,
                condition: [],
                next_yes_stage: 0,
                next_no_stage: 0,
                action_type: "call",
                additonal_action: { tel_num: "1367" },
                relate_to: "none"
            },
            {
                stage_num: 15,
                action_text: "1. 2. 3. Give Polyvalent Hematotoxic Snake. Consult PC",
                frequent: 0,
                times: 1,
                condition: [],
                next_yes_stage: 0,
                next_no_stage: 0,
                action_type: "call",
                additonal_action: { tel_num: "1367" },
                relate_to: "none"
            },
            {
                stage_num: 16,
                action_text: "1. 2. 3. Give activenom for Russell Viper 5 vials. Consult PC",
                frequent: 0,
                times: 1,
                condition: [],
                next_yes_stage: 0,
                next_no_stage: 0,
                action_type: "call",
                additonal_action: { tel_num: "1367" },
                relate_to: "none"
            },
            {
                stage_num: 21,
                action_text: "Observe weakness and neuro sign q 1 hr for 24 hr",
                frequent: 1,
                times: 24,
                condition: [
                    { indicator: "motor_weakness", compare: "=", value: true }
                ],
                next_yes_stage: 31,
                next_no_stage: 22,
                action_type: "alert",
                relate_to: "motor weakness test"
            },
            {
                stage_num: 22,
                action_text: "Observe bleeding and bleeding precaution",
                frequent: 1,
                times: 24,
                condition: [
                    { indicator: "systemic_bleeding", compare: "=", value: true }
                ],
                next_yes_stage: 25,
                next_no_stage: 23,
                action_type: "alert",
                relate_to: "systemic bleeding test"
            },
            {
                stage_num: 23,
                action_text: "CBC, PT, INR, 20 min WBCT initially and then every 6 hr for 4 times (0, 6, 12, 18, 24)",
                frequent: 6,
                times: 4,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 25,
                next_no_stage: 24,
                action_type: "alert",
                relate_to: "blood test"
            },
            {
                stage_num: 24,
                action_text: "CBC, PT, INR, 20 min WBCT, creatinine once daily for 2 times (48, 72)",
                frequent: 24,
                times: 2,
                condition: [
                    { indicator: "platelets", compare: "lt", value: 50000 },
                    { indicator: "INR", compare: "gt", value: 1.2 },
                    { indicator: "WBCT", compare: "equal", value: "Unclotted" }
                ],
                next_yes_stage: 22,
                next_no_stage: 0,
                action_type: "alert",
                relate_to: "blood test"
            },
            {
                stage_num: 25,
                action_text: "",
                frequent: 1,
                times: 24,
                condition: [
                    { indicator: "acute_renal_failure", compare: "=", value: true }
                ],
                next_yes_stage: 16,
                next_no_stage: 26,
                action_type: "none",
                relate_to: "other test"
            },
            {
                stage_num: 26,
                action_text: "",
                frequent: 1,
                times: 24,
                condition: [
                    { indicator: "local_edema", compare: "=", value: true }
                ],
                next_yes_stage: 27,
                next_no_stage: 16,
                action_type: "none",
                relate_to: "other test"
            },
            {
                stage_num: 27,
                action_text: "Consult PC (งูเขียวหางไหม้/งูกะปะ แยกด้วยระบาดวิทยา)",
                frequent: 0,
                times: 1,
                condition: [],
                next_yes_stage: 0,
                next_no_stage: 0,
                action_type: "call",
                additonal_action: { tel_num: "1367" },
                relate_to: "none"
            },

        ];*/

        var stages = [];

        return {
            getAllStagesOfSnakeType(snake_type) {
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