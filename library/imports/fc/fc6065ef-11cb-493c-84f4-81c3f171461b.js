"use strict";
cc._RF.push(module, 'fc606XvEctJPIT0gcPxcUYb', 'gameState');
// Script/AtomFrame/gameState.js

"use strict";

var GameState = {
    default: 0,
    logo: 1,
    login: 2,
    hall: 3,
    room: 4
};

var GameIngState = {
    default: 0,
    start: 1,
    pause: 2,
    gameing: 3,
    gamestop: 4,
    gameover: 5
};

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameState"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.gameState = GameState.default;
        this.gameIngState = GameIngState.default;
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    //
    setGameInLogo: function setGameInLogo() {
        this.gameState = GameState.logo;
    },

    isGameInLogo: function isGameInLogo() {
        return this.gameState == GameState.logo;
    },

    setGameInLogin: function setGameInLogin() {
        this.gameState = GameState.login;
    },

    isGameInLogin: function isGameInLogin() {
        return this.gameState == GameState.login;
    },

    setGameInHall: function setGameInHall() {
        this.gameState = GameState.hall;
    },

    isGameInHall: function isGameInHall() {
        return this.gameState == GameState.hall;
    },

    setGameInRoom: function setGameInRoom() {
        this.gameState = GameState.room;
    },

    isGameInRoom: function isGameInRoom() {
        return this.gameState == GameState.room;
    },

    //游戏中状态
    setGameStart: function setGameStart() {
        this.gameIngState = GameIngState.start;
    },

    isGameStart: function isGameStart() {
        return this.gameIngState == GameIngState.start;
    },

    setGamePause: function setGamePause() {
        this.gameIngState = GameIngState.pause;
    },

    isGamePause: function isGamePause() {
        return this.gameIngState == GameIngState.pause;
    },

    setGameStop: function setGameStop() {
        this.gameIngState = GameIngState.gamestop;
    },

    isGameStop: function isGameStop() {
        return this.gameIngState == GameIngState.gamestop;
    },

    setGameIng: function setGameIng() {
        this.gameIngState = GameIngState.gameing;
    },

    isGameIng: function isGameIng() {
        return this.gameIngState == GameIngState.gameing;
    },

    setGameOver: function setGameOver() {
        this.gameIngState = GameIngState.gameover;
    },

    isGameOver: function isGameOver() {
        return this.gameIngState == GameIngState.gameover;
    }

});

cc._RF.pop();