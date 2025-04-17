# Phaserload - Game Design

An initial attempt to document some of the basic concepts and general information about phaserload to help convince other humans to participate.

## Summary

Collect minerals, so you can buy more gas, so you can collect more minerals.

# Game Overview

## Theme / Setting / Genre

Dystopian future world where the players play as mineral harvester drill operators traveling with and controlling a large harvester drill
The UI & graphics of the game are meant to look like the interior console screen of the drills.

## Core Gameplay Mechanics

Players will drill through a randomly generated world gathering resources. These resources are sold to a central hub. The central hub sells upgrades to the player vehicle that grant various passive and active abilities.

Once the player has plateaued at their current location, they can travel to another randomly generated location. This is not a user selectable location.

- Move through terrain to gather resources
- Sell resources to gather currency
- Use currency to upgrade vehicle and purchase items to make gathering easier
- Travel to new location to gather different resources
- Rinse & Repeat

## Server / Online Mechanics

The goal is to build this game "server first" so that all game logic exists on the server and the players are only ever receiving game state updates and displaying them.
This has the added benefit of making the game natively multiplayer.

### What is Server Side

- All moving/interaction logic
- Player states
- Fluid behavior
- Monster behavior

### What is Client Side

- User input (keyboard & mouse, or touch)
- Animations/Transitions
- Background music
- Custom Alerts (fuel, cargo, health)

# Story

TBD

# Gameplay

## User Interface

### Pre-Game UI

1. Create Server
   - Server Settings
1. Create and Join Lobby
1. Join Room
1. Briefing (When joining new world)

### In-game UI

1. SpaceCo Console
   - Materials Pricelist
   - Fuel Pricelist
   - Vehicle Upgrades
     - Accessories
       - Fuel Siphon
     - Fuel tank
     - Hull
     - Drill
     - Cargo Bay
     - Tracks
   - Items
     - Teleporter (teleport to spaceco)
     - Responder Teleporter (teleport to spaceco and back)
     - Repair Nanites (repair on the go)
     - Timed & remote explosives
     - Timed & remote "freeze" explosives (freezes lava into a mineable mineral, high chance for random concentrated mineral generation)
   - Vehicle Repair
     - Repair Parts (Partial Interest)
     - Repair All (Default)
   - Spaceco outpost repair (mining operations can result in damage to spaceco outposts)
   - Transport (travel to new world)
1. Trade Console
   - Players Cargo
   - Fuel
   - Items
   - Currency
1. Personal Console
   - Your Cargo
   - Vehicle Config (Read Only)
   - Items
   - Your upgrades
   - Settings
   - Help
1. Settings
   - Sound Effect Volume
   - Music Volume
   - Health Alert
   - Cargo Alert
   - Fuel Alert
1. Help
   - General game overview help (summary of game functions and goals)
   - Controls

# Locations

Types of terrain / worlds to visit

"worlds" are defined as a series of "packs" which can be played; randomly (shuffled), or procedurally (level by level in order)
These "worlds" are simply mineable space rocks, think:

- Asteroids
- Meteorites
- Lava Planet
- Water World (ft. Kevin Spacey)
- Moons
- Planets (of various biomes?)

# Leveling (Progression)

Leveling is accomplished by upgrading your vehicle.
The game currently continues indefinitely, though configurable endgame conditions may be developed later.

# First Time Experience

TBD
