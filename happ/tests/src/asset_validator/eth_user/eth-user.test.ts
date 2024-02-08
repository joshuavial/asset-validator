import { assert, test } from "vitest";

import { runScenario, dhtSync, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createEthUser, sampleEthUser } from './common.js';

test('create EthUser', async () => {
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

    // Alice creates a EthUser
    const record: Record = await createEthUser(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read EthUser', async () => {
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

    const sample = await sampleEthUser(alice.cells[0]);

    // Alice creates a EthUser
    const record: Record = await createEthUser(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created EthUser
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "get_eth_user",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);

  });
});


test('create and update EthUser', async () => {
  await runScenario(async scenario => {
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';
    const appSource = { appBundleSource: { path: testAppPath } };
    const [alice] = await scenario.addPlayersWithApps([appSource]);
    await scenario.shareAllAgents();

    const sample = await sampleEthUser(alice.cells[0]);

    // Alice creates an EthUser
    const record: Record = await createEthUser(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice], alice.cells[0].cell_id[0]);

    // Alice attempts to update the EthUser's eth_address, which should fail
    let updatedSampleWithNewAddress = { ...sample, eth_address: "0xNEW_ETH_ADDRESS" };
    try {
      await alice.cells[0].callZome({
        zome_name: "eth_user",
        fn_name: "update_eth_user",
        payload: {
          original_eth_user_hash: record.signed_action.hashed.hash,
          updated_eth_user: updatedSampleWithNewAddress,
        },
      });
      assert.fail("Updating the eth_address should not be allowed");
    } catch (e) {
      assert.match(e.toString(), /Changing eth_address is not allowed/);
    }

    // Alice successfully updates the EthUser's handle
    let updatedSampleWithNewHandle = { ...sample, handle: "AliceNewHandle" };
    const updateRecord = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "update_eth_user",
      payload: {
        original_eth_user_hash: record.signed_action.hashed.hash,
        updated_eth_user: updatedSampleWithNewHandle,
      },
    });
    assert.ok(updateRecord, "The EthUser should be successfully updated with a new handle");

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice], alice.cells[0].cell_id[0]);

    // Alice gets the updated EthUser
    let updatedEthUser = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "get_eth_user",
      payload: updateRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(updatedSampleWithNewHandle, decode((updatedEthUser.entry as any).Present.entry) as any, "The EthUser's handle should be updated");

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice], alice.cells[0].cell_id[0]);

    // Alice gets the updated EthUser
    updatedEthUser = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "get_eth_user",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((updatedEthUser.entry as any).Present.entry) as any, "The eth_address should remain unchanged");
  });
});
test('create user, test who am i, update user handle, test who am i again', async () => {
  await runScenario(async scenario => {
    const testAppPath = process.cwd() + '/../workdir/asset-validator.happ';
    const appSource = { appBundleSource: { path: testAppPath } };
    const [alice] = await scenario.addPlayersWithApps([appSource]);
    await scenario.shareAllAgents();

    const sample = await sampleEthUser(alice.cells[0]);

    // Alice creates an EthUser
    const record: Record = await createEthUser(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice], alice.cells[0].cell_id[0]);

    // Alice checks who she is
    const whoAmIRecord = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "who_am_i",
      payload: { agent_pub_key: alice.cells[0].cell_id[1] },
    });
    assert.ok(whoAmIRecord, "Alice should be able to find herself with who_am_i");

    // Alice updates her EthUser handle
    const newHandle = "AliceNewHandle";
    const updatedSample = { ...sample, handle: newHandle };
    const updateRecord = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "update_eth_user",
      payload: {
        original_eth_user_hash: record.signed_action.hashed.hash,
        updated_eth_user: updatedSample,
      },
    });
    assert.ok(updateRecord, "Alice should be able to update her handle");

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice], alice.cells[0].cell_id[0]);

    // Alice checks who she is again
    const updatedWhoAmIRecord = await alice.cells[0].callZome({
      zome_name: "eth_user",
      fn_name: "who_am_i",
      payload: { agent_pub_key: alice.cells[0].cell_id[1] },
    });
    assert.ok(updatedWhoAmIRecord, "Alice should still be able to find herself with who_am_i after updating her handle");
    assert.equal(updatedSample.handle, decode((updatedWhoAmIRecord.entry as any).Present.entry).handle, "The handle in who_am_i should be updated");
  });
});
