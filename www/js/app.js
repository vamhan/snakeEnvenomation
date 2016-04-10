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
                var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
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

    .controller('PatientPUtilCtrl', function($scope, $state, $parse) {
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
        
        var snakes = ["russel", "greenPit", "malayanPit", "cobra", "kingCobra", "bandedKrait", "malayanKrait", "unknown"];
        var snakeCheckbox = [false, false, false, false, false, false, false, false]
        $scope.snake = snakeCheckbox;
        
        $scope.snakeTypeSelect = function(selectedSnake) {
            angular.forEach($scope.snake, function(value, key) {
                $scope.snake[key] = false;
            });
            $scope.snake[selectedSnake] = true;
        };
        
        $scope.confirm = function(snake) {
            angular.forEach($scope.snake, function(value, key) {
                if ($scope.snake[key] == true) {
                    alert(snakes[key])
                }
            });
        }
    })
