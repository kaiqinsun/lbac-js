/*global define*/

define(function () {
    'use strict';

    var io;

    return {

        // Setter
        set: function (newIo) {
            io = newIo;
        },

        read: function () {
            return io.read();
        },

        readLn: function () {
            return io.readLn();
        },

        write: function () {
            return io.write.apply(null, arguments);
        },

        writeLn: function () {
            return io.writeLn.apply(null, arguments);
        },

        halt: function () {
            return io.halt();
        }
    };
});