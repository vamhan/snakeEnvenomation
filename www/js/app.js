// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('snakeEnvenomation', ['ionic', 'ngCordova'])

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })

    .config(function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('signin', {
                url: '/sign-in',
                templateUrl: 'sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('record', {
                url: '/record',
                templateUrl: 'templates/record.html',
                controller: 'RecordCtrl'
            })
            .state('patientPUtil', {
                url: '/patientPUtil',
                templateUrl: 'templates/patientPUtil.html',
                controller: 'PatientPUtilCtrl'
            })
            .state('bloodSample', {
                url: '/bloodSample',
                templateUrl: 'templates/bloodSample.html',
                controller: 'BloodSampleCtrl'
            })
            .state('hmanagement', {
                url: '/hematotoxic_management',
                templateUrl: 'templates/hematotoxic_management.html',
                controller: 'HManagementCtrl'
            })
            .state('bloodResultList', {
                url: '/bloodResultList',
                templateUrl: 'templates/bloodResultList.html',
                controller: 'HManagementCtrl'
            })
            .state('bloodResult', {
                url: '/bloodResult',
                templateUrl: 'templates/bloodResult.html',
                controller: 'HManagementCtrl'
            })



        $urlRouterProvider.otherwise('/sign-in');

    })

    .controller('SignInCtrl', function($scope, $state) {
        $scope.login = function(user, patient) {
            $state.go('record');
        };
    })

    .controller('RecordCtrl', function($scope, $state, $cordovaDatePicker, $parse) {
        $scope.openDatePicker = function(element) {
            var options = {
                date: new Date(),
                mode: 'date',
                allowOldDates: true,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function(date) {
                var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                var dateS = date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear()
                var model = $parse(element)
                model.assign($scope, dateS)
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
            $state.go('patientPUtil');
        };
    })

    .controller('PatientPUtilCtrl', function($scope, $state, $parse, $ionicPopover) {
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

        var snakes = [
            { id: 0, name: "russel", thaiName: "งูแมวเซา", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูแมวเซา" },
            { id: 1, name: "greenPit", thaiName: "งูเขียวหางไหม้", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูเขียวหางไหม้" },
            { id: 2, name: "malayanPit", thaiName: "งูกะปะ", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูกะปะ" },
            { id: 3, name: "cobra", thaiName: "งูเห่า", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูเห่า" },
            { id: 4, name: "kingCobra", thaiName: "งูจงอาง", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูจงอาง" },
            { id: 5, name: "bandedKrait", thaiName: "งูสามเหลี่ยม", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูสามเหลี่ยม" },
            { id: 6, name: "malayanKrait", thaiName: "งูทับสมิงคลา", img1: "img/snake.jpg", img2: "img/snake.jpg", info: "งูทับสมิงคลา" },
            { id: 7, name: "unknown", thaiName: "งูไม่ทราบชนิด" }
        ]
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

        $scope.confirm = function(snake) {
            /*angular.forEach($scope.snakeCheckbox, function(value, key) {
                if ($scope.snakeCheckbox[key] == true) {
                    alert(snakes[key].name)
                }
            });*/
            $state.go('bloodSample');
        };
    })

    .controller('BloodSampleCtrl', function($scope, $state) {
        $scope.confirm = function(snake) {
            $state.go('hmanagement');
        };
    })

    .controller('HManagementCtrl', function($scope, $state, $ionicPopup) {
        $scope.confirm = function(snake) {
            $state.go('management');
        };

        $scope.navigateToBloodResultList = function() {
            $state.go('bloodResultList');
        };

        $scope.navigateToBloodResult = function() {
            $state.go('bloodResult');
        };

        $scope.showPopup = function(type) {
            var title = ""
            var content = ""
            if (type == 0) {
                title = "Indication for antivenom"
                content = "<ul><li>Systemic bleeding (except microscopic hematuria) or</li>"
                        + "<li>Platelets< 50,000/mcL or</li>"
                        + "<li>INR > 1.20 or</li>"
                        + "<li>20-min WBCT: not clot</li></ul>"
            } else {
                title = "How to manage"
                content = "<ul><li>หากมี Systemic bleeding (except microscopic hematuria) -> go to 1.2 and consult PC</li>"
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
                    { text: 'Close', type: 'button-positive'}
                ]
            });
        };
    })
