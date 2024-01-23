import { assert, test } from "vitest";

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createGenerator, sampleGenerator } from './common.js';

test('create Generator', async () => {
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

    // Alice creates a Generator
    const record: Record = await createGenerator(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Generator', async () => {
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

    const sample = await sampleGenerator();
    // Alice creates a Generator
    const record: Record = await createGenerator(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created Generator
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_generator",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update Generator', async () => {
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

    // Alice creates a Generator
    const record: Record = await createGenerator(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Generator
    let contentUpdate: any = await sampleGenerator();
    contentUpdate.name = "bananas";
    let updateInput = {
      previous_generator_hash: originalActionHash,
      updated_generator: contentUpdate,
    };

    await pause(1200);
    // Assert that Bob trying to edit Alice's generator fails
    try {
      let contentUpdateBob: any = await sampleGenerator();
      contentUpdateBob.name = "apples!";
      let updateInputBob = {
        previous_generator_hash: originalActionHash,
        updated_generator: contentUpdateBob,
      };
      let updatedRecordBob: Record = await bob.cells[0].callZome({
        zome_name: "validation_claims",
        fn_name: "update_generator",
        payload: updateInputBob,
      });
      assert.fail("Bob should not be able to update Alice's generator");
    } catch (e) {
      assert.match(e.toString(), /.*InvalidCommit.*/);
    }

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_generator",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Generator
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_generator",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    const actual0 = decode((readUpdatedOutput0.entry as any).Present.entry) as Generator;
    assert.equal(actual0.name, contentUpdate.name);

    // Alice updates the Generator again
    contentUpdate = await sampleGenerator();
    updateInput = { 
      previous_generator_hash: updatedRecord.signed_action.hashed.hash,
      updated_generator: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_generator",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated Generator
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_generator",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    const actual1 = decode((readUpdatedOutput1.entry as any).Present.entry);
    assert.equal(actual1.name, contentUpdate.name)
  });
});

test('create and delete Generator', async () => {
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

    // Alice creates a Generator
    const record: Record = await createGenerator(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the Generator
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "delete_generator",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted Generator
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_generator",
      payload: record.signed_action.hashed.hash,
    });
    assert.notOk(readDeletedOutput);
  });
});
