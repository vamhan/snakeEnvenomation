var user = {user_id: 1, physician_name: "Varunya Thavornun", hospital: {hospital_name: "Ram", hospital_province: "BKK"}};
var patient = {patient_id: 1, patient_name: "kkk", patient_gender: "Female", patient_birthdate: "10/04/1980"};
var record = {}
var bloodTests = [];


angular.module('snakeEnvenomation.services', [])

    .factory('UserService', function() {
        
        return {
            loginUser: function(username, patientId) {
                user["username"] = username;
                patient["patient_national_id"] = patientId;
                return username == "root";
            },
            getUserInfo: function() {
                return user;
            },
            getPatientInfo: function() {
                return patient;
            } 
        }
    })
    
    .factory('RecordService', function() {
        
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

    .factory('SnakeService', function() {

        var snakes = [
            { snake_id: 0, name: "Russell Viper", thaiName: "งูแมวเซา", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูแมวเซา" },
            { snake_id: 1, name: "Green Pit Viper", thaiName: "งูเขียวหางไหม้", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูเขียวหางไหม้" },
            { snake_id: 2, name: "Malayan Pit Viper", thaiName: "งูกะปะ", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูกะปะ" },
            { snake_id: 3, name: "Cobra", thaiName: "งูเห่า", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูเห่า" },
            { snake_id: 4, name: "king Cobra", thaiName: "งูจงอาง", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูจงอาง" },
            { snake_id: 5, name: "Banded Krait", thaiName: "งูสามเหลี่ยม", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูสามเหลี่ยม" },
            { snake_id: 6, name: "Malayan Krait", thaiName: "งูทับสมิงคลา", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูทับสมิงคลา" },
            { snake_id: 7, name: "unknown", thaiName: "งูไม่ทราบชนิด" }
        ];

        return {
            getAllSnakes: function() {
                return snakes;
            },
            getSnakeByID: function(snakeId) {
                return snakes[snakeId]
            }
        }
    })
    
    .factory('BloodTestService', function() {
        
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

    .factory('StageService', function() {

        var stages = [
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

        ];

        return {
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