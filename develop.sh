#! /usr/bin/env bash
# simple script to load up most recent version of holochain
cd ~/projects/holochain/holochain
nix develop .#coreDev --command "zsh"
