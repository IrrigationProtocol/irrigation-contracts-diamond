#!/bin/bash

# Define the file URL and the local file path
file_url="https://raw.githubusercontent.com/BeanstalkFarms/Beanstalk/master/protocol/abi/Beanstalk.json"
local_file_path="Beanstalk.json"
solidity_version="^0.8.17"
license="MIT"
name="IBeanstalkUpgradeable"

if wget -N $file_url -O $local_file_path; then
    npx abi-to-sol --validate -A -S -V $solidity_version -L $license $name < $local_file_path > contracts/beanstalk/$name.sol
fi

