import { assert, test } from "vitest";

import { runScenario, dhtSync, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createIssuance, sampleIssuance } from './common.js';

test('create Issuance', async () => {
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

    // Alice creates a Issuance
    const record: Record = await createIssuance(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read Issuance', async () => {
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

    const sample = await sampleIssuance(alice.cells[0]);

    // Alice creates a Issuance
    const record: Record = await createIssuance(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created Issuance
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_original_issuance",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);

    // Bob gets the Generations for the new Issuance
    let linksToGenerations: Link[] = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_issuances_for_generation",
      payload: sample.generation_hashes[0]
    });
    assert.equal(linksToGenerations.length, 1);
    assert.deepEqual(linksToGenerations[0].target, record.signed_action.hashed.hash);
  });
});

test('create and update Issuance', async () => {
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

    // Alice creates a Issuance
    const record: Record = await createIssuance(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the Issuance
    let contentUpdate: any = await sampleIssuance(alice.cells[0]);
    let updateInput = {
      original_issuance_hash: originalActionHash,
      previous_issuance_hash: originalActionHash,
      updated_issuance: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_issuance",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated Issuance
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_latest_issuance",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Issuance again
    contentUpdate = await sampleIssuance(alice.cells[0]);
    updateInput = { 
      original_issuance_hash: originalActionHash,
      previous_issuance_hash: updatedRecord.signed_action.hashed.hash,
      updated_issuance: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "update_issuance",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated Issuance
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_latest_issuance",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

    // Bob gets all the revisions for Issuance
    const revisions: Record[] = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_all_revisions_for_issuance",
      payload: originalActionHash,
    });
    assert.equal(revisions.length, 3);
    assert.deepEqual(contentUpdate, decode((revisions[2].entry as any).Present.entry) as any);
  });
});

test('create and delete Issuance', async () => {
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

    const sample = await sampleIssuance(alice.cells[0]);

    // Alice creates a Issuance
    const record: Record = await createIssuance(alice.cells[0], sample);
    assert.ok(record);

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the Generations for the new Issuance
    let linksToGenerations: Link[] = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_issuances_for_generation",
      payload: sample.generation_hashes[0]
    });
    assert.equal(linksToGenerations.length, 1);
    assert.deepEqual(linksToGenerations[0].target, record.signed_action.hashed.hash);

    // Alice deletes the Issuance
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "delete_issuance",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the oldest delete for the Issuance
    const oldestDeleteForIssuance = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_oldest_delete_for_issuance",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(oldestDeleteForIssuance);
        
    // Bob gets the deletions for the Issuance
    const deletesForIssuance = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_all_deletes_for_issuance",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(deletesForIssuance.length, 1);

    // Bob gets the Generations for the Issuance again
    linksToGenerations = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_issuances_for_generation",
      payload: sample.generation_hashes[0]
    });
    assert.equal(linksToGenerations.length, 0);

    // Bob gets the deleted Generations for the Issuance 
    const deletedLinksToGenerations = await bob.cells[0].callZome({
      zome_name: "validation_claims",
      fn_name: "get_deleted_issuances_for_generation",
      payload: sample.generation_hashes[0]
    });
    assert.equal(deletedLinksToGenerations.length, 1);

  });
});
