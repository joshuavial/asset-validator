import { assert, test } from "vitest";

import { runScenario, dhtSync, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createGeneration, sampleGeneration } from './common.js';

test('create Generation', async () => {
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

    // Alice creates a Generation
    const record: Record = await createGeneration(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Generation', async () => {
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

    const sample = await sampleGeneration(alice.cells[0]);

    // Alice creates a Generation
    const record: Record = await createGeneration(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created Generation
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_original_generation",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);

  });
});

test('create and update Generation', async () => {
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

    // Alice creates a Generation
    const record: Record = await createGeneration(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Generation
    let contentUpdate: any = await sampleGeneration(alice.cells[0]);
    let updateInput = {
      original_generation_hash: originalActionHash,
      previous_generation_hash: originalActionHash,
      updated_generation: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_generation",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated Generation
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_latest_generation",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Generation again
    contentUpdate = await sampleGeneration(alice.cells[0]);
    updateInput = { 
      original_generation_hash: originalActionHash,
      previous_generation_hash: updatedRecord.signed_action.hashed.hash,
      updated_generation: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_generation",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated Generation
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_latest_generation",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

    // Bob gets all the revisions for Generation
    const revisions: Record[] = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_all_revisions_for_generation",
      payload: originalActionHash,
    });
    assert.equal(revisions.length, 3);
    assert.deepEqual(contentUpdate, decode((revisions[2].entry as any).Present.entry) as any);
  });
});

test('create and delete Generation', async () => {
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

    const sample = await sampleGeneration(alice.cells[0]);

    // Alice creates a Generation
    const record: Record = await createGeneration(alice.cells[0], sample);
    assert.ok(record);

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);


    // Alice deletes the Generation
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "delete_generation",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the oldest delete for the Generation
    const oldestDeleteForGeneration = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_oldest_delete_for_generation",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(oldestDeleteForGeneration);
        
    // Bob gets the deletions for the Generation
    const deletesForGeneration = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_all_deletes_for_generation",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(deletesForGeneration.length, 1);
  });
});
test('create eth_user, generation, and observe energy', async () => {
  await runScenario(async scenario => {
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';
    const appSource = { appBundleSource: { path: testAppPath } };
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);
    await scenario.shareAllAgents();

    // Alice creates an eth_user
    const ethUser = { address: '0x123', signature: '0x456' };
    const ethUserHash = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "create_eth_user",
      payload: ethUser,
    });
    assert.ok(ethUserHash);

    // Alice creates a Generation for the eth_user
    const generationSample = await sampleGeneration(alice.cells[0]);
    const generationRecord: Record = await createGeneration(alice.cells[0], generationSample);
    assert.ok(generationRecord);

    // Bob makes an energy observation on the generation
    const observation = { energy: 42, timestamp: Date.now() };
    const observationRecord: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "create_observation",
      payload: {
        observation: observation,
        generation_hash: generationRecord.signed_action.hashed.hash,
      },
    });
    assert.ok(observationRecord);

    // Test that Alice receives a signal about the observation
    // This part of the test will depend on the implementation of the signal handling
    // which is not provided in the current context. You would typically use a mock
    // or a test framework feature to listen for and assert on signals received.
  });
});
