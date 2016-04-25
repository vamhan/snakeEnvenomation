//var user = {user_id: 1, physician_name: "Varunya Thavornun", hospital: {hospital_name: "Ram", hospital_province: "BKK"}};
//var patient = {patient_id: 1, patient_name: "kkk", patient_gender: "Female", patient_birthdate: "10/04/1980"};


//var api_host_url = "http://localhost:3000/api"
var api_host_url = "http://cdss.topwork.asia:9080/snake-envenomation/api"

angular.module('snakeEnvenomation.services', ['angular-md5'])

    .factory('UserService', function($q, $http, md5) {
        var user = {};
        var patient = {};
        
        return {
            loginUser: function(username, patientId) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                $http.get(api_host_url + "/login?username=" + md5.createHash(username || '') + "&patient_national_id=" + md5.createHash(patientId || ''))
                    .success(function(data, status, headers, config) {
                        user = data.physician;
                        patient = data.patient;
                        user["username"] = username;
                        patient["patient_national_id"] = patientId;
                        deferred.resolve();
                    })
                    .error(function(data, status, headers, config) {
                        deferred.reject(status);
                    });
                promise.success = function(fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function(fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getUserInfo: function() {
                return user;
            },
            getPatientInfo: function() {
                return patient;
            } 
        }
    })

    .factory('RecordService', function($q, $http) {
        var record = {};
        
        return {
            addRecord: function(incident) {
                record["record_id"] = 1;
            },
            getRecord: function() {
                return record;
            },
            updateRecord: function(bleeding, resFail, snakeType) {
                record["systemic_bleeding"] = bleeding;
                record["respiratory_failure"] = resFail;
                record["snake_type"] = snakeType;
            } 
        }
    })

    .factory('SnakeService', function($q, $http) {
        
        var snakes = [];

        return {
            getAllSnakes: function() {
                if (snakes.length > 0) {
                    return snakes;
                } else {
                    var deferred = $q.defer();
                    var promise = deferred.promise;
                    $http.get(api_host_url + "/snakes")
                        .success(function(data, status, headers, config) {
                            snakes = data;
                            deferred.resolve(snakes);
                        })
                        .error(function(data, status, headers, config) {
                            deferred.reject(status);
                        });
                    promise.success = function(fn) {
                        promise.then(fn);
                        return promise;
                    }
                    promise.error = function(fn) {
                        promise.then(null, fn);
                        return promise;
                    }
                    return promise;
                }
            },
            getSnakeByID: function(snakeId) {
                return snakes[snakeId]
            }
        }
    })

    .factory('BloodTestService', function($q, $http) {
        
        var bloodTests = [];

        return {
            addBloodTest: function(bloodTest) {
                bloodTests.push(bloodTest);
            },
            getBloodTests: function() {
                return bloodTests;
            },
            getLatestBloodTest: function() {
                return bloodTests[bloodTests.length - 1]
            }
        }
    })

    .factory('StageService', function($q, $http) {

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
                    .success(function(data, status, headers, config) {
                        stages = data;
                        deferred.resolve(stages[0]);
                    })
                    .error(function(data, status, headers, config) {
                        deferred.reject(status);
                    });
                promise.success = function(fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function(fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },
            getStage: function(stage_num) {
                var stage;
                angular.forEach(stages, function(value, key) {
                    if (stages[key].stage_num == stage_num) {
                        stage = stages[key];
                    }
                });
                return stage;
            },
            checkCondition: function(stage, data) {
                var pass = false
                angular.forEach(stage.condition, function(value, key) {
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
                });
                return pass;
            }
        }
    })