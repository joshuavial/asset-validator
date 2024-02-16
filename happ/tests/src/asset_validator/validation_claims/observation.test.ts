import { assert, test } from "vitest";

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createObservation, sampleObservation, createGeneration, sampleGeneration } from './common.js';
import { createEthUser, sampleEthUser } from '../eth_user/common.js';

test('create Observation', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Observation
    const ethUserSample = await sampleEthUser(alice.cells[0], {eth_address: "0xeth"});
    const ethUserRecord: Record = await createEthUser(alice.cells[0], ethUserSample);
    const generationSample = await sampleGeneration(alice.cells[0], {user_address: ethUserSample.eth_address});
    const generation = await createGeneration(alice.cells[0], generationSample);
    const observationSample = await sampleObservation(generation.signed_action.hashed.hash, {user_address: ethUserSample.eth_address});
    const record: Record = await createObservation(alice.cells[0], observationSample);
    assert.ok(record);
  });
});

test('create and read Observation', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const generation = await createGeneration(alice.cells[0]);
    const ethUserSample = await sampleEthUser(alice.cells[0], {eth_address: "0xeth"});
    const ethUserRecord: Record = await createEthUser(alice.cells[0], ethUserSample);
    const generationSample = await sampleGeneration(alice.cells[0], {user_address: ethUserSample.eth_address});
    const generation = await createGeneration(alice.cells[0], generationSample);
    const sample = await sampleObservation(generation.signed_action.hashed.hash, {user_address: ethUserSample.eth_address});

    // Alice creates a Observation
    const record: Record = await createObservation(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Observation
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_observation",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample.observation, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test.skip('create and update Observation', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Observation
    const ethUserSample = await sampleEthUser(alice.cells[0], {eth_address: "0xeth"});
    const ethUserRecord: Record = await createEthUser(alice.cells[0], ethUserSample);
    const generationSample = await sampleGeneration(alice.cells[0], {user_address: ethUserSample.eth_address});
    const generation = await createGeneration(alice.cells[0], generationSample);
    const sample = await sampleObservation(generation.signed_action.hashed.hash, {user_address: ethUserSample.eth_address});
    const record: Record = await createObservation(alice.cells[0], sample);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Observation
    let contentUpdate: any = await sampleObservation(generation.signed_action.hashed.hash);
    let updateInput = {
      previous_observation_hash: originalActionHash,
      updated_observation: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_observation",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Observation
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_observation",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate.observation, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Observation again
    contentUpdate = await sampleObservation(generation.signed_action.hashed.hash);
    updateInput = { 
      previous_observation_hash: updatedRecord.signed_action.hashed.hash,
      updated_observation: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_observation",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Observation
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_observation",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate.observation, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('get observations for generation', async () => {
  await runScenario(async scenario => {
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';
    const appSource = { appBundleSource: { path: testAppPath } };
    const [alice] = await scenario.addPlayersWithApps([appSource]);
    await scenario.shareAllAgents();

    // Alice creates a Generation
    const ethUserSample = await sampleEthUser(alice.cells[0], {eth_address: "0xeth"});
    const ethUserRecord: Record = await createEthUser(alice.cells[0], ethUserSample);
    const generationSample = await sampleGeneration(alice.cells[0], {user_address: ethUserSample.eth_address});
    const generationRecord: Record = await createGeneration(alice.cells[0], generationSample);
    assert.ok(generationRecord);

    // Alice creates multiple Observations linked to the Generation
    const observationSample1 = await sampleObservation(generationRecord.signed_action.hashed.hash, {user_address: ethUserSample.eth_address});
    const observationRecord1: Record = await createObservation(alice.cells[0], observationSample1);
    assert.ok(observationRecord1);

    const observationSample2 = await sampleObservation(generationRecord.signed_action.hashed.hash, {user_address: ethUserSample.eth_address});
    const observationRecord2: Record = await createObservation(alice.cells[0], observationSample2);
    assert.ok(observationRecord2);

    // Wait for the created entries to be propagated in the DHT
    await pause(1200);

    // Alice retrieves Observations for the Generation
    const observations: Array<Record> = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_observations_for_generation",
      payload: generationRecord.signed_action.hashed.hash,
    });
    assert.equal(observations.length, 2, 'Should retrieve two observations');
    assert.deepEqual(observations.map(obs => obs.signed_action.hashed.hash), [observationRecord1.signed_action.hashed.hash, observationRecord2.signed_action.hashed.hash], 'The retrieved observations should match the created ones');
  });
});
