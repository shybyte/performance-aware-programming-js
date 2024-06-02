function addNumber(a, b) {
  return a + b;
}

function main() {
  // 0x4D2, 0x162E
  return addNumber(1234, 5678);
}

// // Collect type information on next call of function
// %PrepareFunctionForOptimization(addNumber)


// // Call function once to fill type information
// addNumber(1234,5678);

// // Call function again to go from uninitialized -> pre-monomorphic -> monomorphic
// addNumber(1234, 5678);
// %OptimizeFunctionOnNextCall(addNumber);
// addNumber(1234, 5678);

for(let i=0; i<1_000_000; i++) {
  main();
}
