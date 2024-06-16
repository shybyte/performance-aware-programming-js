const std = @import("std");

pub fn sumArraySingleScalar(array: []const u32) u64 {
    var result: u64 = 0;

    for (array) |elem| {
        result += elem;
    }

    return result;
}
