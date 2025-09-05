use fuels::{prelude::*, types::{ContractId}};
use fuels::types::Bits256;

// Load abi from json
abigen!(Contract(
    name = "MyContract",
    abi = "out/debug/contract-abi.json"
));

async fn get_contract_instance() -> (MyContract<WalletUnlocked>, ContractId, WalletUnlocked) {
    // Launch a local network and deploy the contract
    let mut wallets = launch_custom_provider_and_get_wallets(
        WalletsConfig::new(
            Some(1),             /* Single wallet */
            Some(1),             /* Single coin (UTXO) */
            Some(1_000_000_000), /* Amount per coin */
        ),
        None,
        None,
    )
    .await
    .unwrap();
    let wallet = wallets.pop().unwrap();

    let id = Contract::load_from(
        "./out/debug/contract.bin",
        LoadConfiguration::default(),
    )
    .unwrap()
    .deploy(&wallet, TxPolicies::default())
    .await
    .unwrap();

    let instance = MyContract::new(id.clone(), wallet.clone());

    (instance, id.into(), wallet)
}

#[tokio::test]
async fn test_create_campaign_returns_incrementing_id() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // prepare inputs
    let target_goal: u64 = 1_000;
    let deadline: u64 = 10_000;

    // first create
    let res1 = instance
        .methods()
        .create_campaign(target_goal, deadline)
        .call()
        .await
        .unwrap();
    assert_eq!(res1.value, 1);

    // second create gets id 2
    let res2 = instance
        .methods()
        .create_campaign(target_goal, deadline)
        .call()
        .await
        .unwrap();
    assert_eq!(res2.value, 2);
}

#[tokio::test]
async fn test_campaign_is_created_with_desired_inputs() {
    let (instance, _id, wallet) = get_contract_instance().await;

    // inputs
    let target_goal: u64 = 42_000;
    let deadline: u64 = 123_456;

    let res = instance
        .methods()
        .create_campaign(target_goal, deadline)
        .call()
        .await
        .unwrap();

    let created_id = res.value;

    // fetch campaign and assert fields
    let campaign_opt = instance
        .methods()
        .get_campaign(created_id)
        .call()
        .await
        .unwrap()
        .value;

    let campaign = campaign_opt.expect("expected Some(campaign)");

    assert_eq!(campaign.id, created_id);
    assert_eq!(campaign.target_goal, target_goal);
    assert_eq!(campaign.deadline, deadline);
    assert_eq!(campaign.total_raised, 0);
    assert!(campaign.asset_id.is_none());

    // owner equals msg_sender (wallet)
    let owner_addr = instance
        .methods()
        .get_campaign_owner_addr(created_id)
        .call()
        .await
        .unwrap()
        .value
        .expect("owner should be an Address");

    assert_eq!(owner_addr, wallet.address().into());
}

#[tokio::test]
async fn test_campaign_counter_increments_properly() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // initial count is 0
    let initial = instance.methods().get_campaign_count().call().await.unwrap().value;
    assert_eq!(initial, 0);

    // create first campaign
    instance
        .methods()
        .create_campaign(100, 1000)
        .call()
        .await
        .unwrap();

    let after_one = instance.methods().get_campaign_count().call().await.unwrap().value;
    assert_eq!(after_one, 1);

    // create second campaign
    instance
        .methods()
        .create_campaign(200, 2000)
        .call()
        .await
        .unwrap();

    let after_two = instance.methods().get_campaign_count().call().await.unwrap().value;
    assert_eq!(after_two, 2);
}

#[tokio::test]
async fn test_next_id_behaves_correctly() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // Initially next_id is 1
    let next_1 = instance.methods().get_next_id().call().await.unwrap().value;
    assert_eq!(next_1, 1);

    // After one creation next_id should be 2
    let first_id = instance
        .methods()
        .create_campaign(1, 10)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(first_id, 1);
    let next_2 = instance.methods().get_next_id().call().await.unwrap().value;
    assert_eq!(next_2, 2);

    // After another creation next_id should be 3
    let second_id = instance
        .methods()
        .create_campaign(2, 20)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(second_id, 2);
    let next_3 = instance.methods().get_next_id().call().await.unwrap().value;
    assert_eq!(next_3, 3);
}

#[tokio::test]
async fn test_contribute_increments_total_raised() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // Create a campaign
    let target_goal: u64 = 5_000;
    let deadline: u64 = 50_000;
    let created_id = instance
        .methods()
        .create_campaign(target_goal, deadline)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(created_id, 1);

    // Initial state
    let c0 = instance
        .methods()
        .get_campaign(1)
        .call()
        .await
        .unwrap()
        .value
        .expect("some campaign");
    assert_eq!(c0.total_raised, 0);

    // Contribute 100 (forward base asset amount)
    let total_after_100 = instance
        .methods()
        .contribute(1, 100)
        .call_params(CallParameters::default().with_amount(100).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(total_after_100, 100);

    // Snapshot asset_id after first contribution
    let c_after_first = instance
        .methods()
        .get_campaign(1)
        .call()
        .await
        .unwrap()
        .value
        .expect("some campaign");
    let asset_id_after_first = c_after_first
        .asset_id
        .clone()
        .expect("asset_id should be set after first contribution");

    // Contribute 250 more (same base asset)
    let total_after_350 = instance
        .methods()
        .contribute(1, 250)
        .call_params(CallParameters::default().with_amount(250).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(total_after_350, 350);

    // Read back
    let c1 = instance
        .methods()
        .get_campaign(1)
        .call()
        .await
        .unwrap()
        .value
        .expect("some campaign");
    assert_eq!(c1.total_raised, 350);
    let asset_id_after_second = c1
        .asset_id
        .clone()
        .expect("asset_id should remain set after second contribution");

    // Asset id remains the same across contributions
    assert_eq!(asset_id_after_second, asset_id_after_first);

    // Asset id equals the base asset id
    let base_bits: Bits256 = AssetId::default().into();
    assert_eq!(asset_id_after_second, base_bits);
}

#[tokio::test]
async fn test_contribute_reverts_on_zero_amount() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // Create a campaign
    let created_id = instance
        .methods()
        .create_campaign(1_000, 10_000)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(created_id, 1);

    // Attempt to contribute zero amount should revert (require amount > 0)
    let res = instance
        .methods()
        .contribute(1, 0)
        .call_params(CallParameters::default().with_amount(0).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await;

    assert!(res.is_err(), "expected revert when amount == 0");
}

#[tokio::test]
async fn test_contribute_reverts_on_invalid_campaign_id() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // No campaigns yet: id 0 and id 1 are invalid for contribute
    let res_id0 = instance
        .methods()
        .contribute(0, 100)
        .call_params(CallParameters::default().with_amount(100).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await;
    assert!(res_id0.is_err(), "expected revert for id == 0");

    // Create one campaign; valid id is 1
    let created_id = instance
        .methods()
        .create_campaign(1_000, 10_000)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(created_id, 1);

    // Next id is 2, which is invalid for contribute (must be < next_id)
    let res_id2 = instance
        .methods()
        .contribute(2, 100)
        .call_params(CallParameters::default().with_amount(100).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await;
    assert!(res_id2.is_err(), "expected revert for id >= next_id");
}

#[tokio::test]
async fn test_contribute_reverts_on_amount_mismatch() {
    let (instance, _id, _wallet) = get_contract_instance().await;

    // Create a campaign
    let created_id = instance
        .methods()
        .create_campaign(1_000, 10_000)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(created_id, 1);

    // Try contributing with mismatched forwarded amount
    let res = instance
        .methods()
        .contribute(1, 100)
        .call_params(CallParameters::default().with_amount(99).with_asset_id(AssetId::default()))
        .unwrap()
        .call()
        .await;

    assert!(res.is_err(), "expected revert when msg_amount != amount param");
}

#[tokio::test]
async fn test_list_campaigns_returns_all_in_order() {
    let (instance, _id, wallet) = get_contract_instance().await;

    // Initially empty
    let empty = instance
        .methods()
        .list_campaigns()
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(empty.len(), 0);

    // Create three campaigns
    let inputs = vec![
        (100u64, 1_000u64),
        (200u64, 2_000u64),
        (300u64, 3_000u64),
    ];

    for (tg, dl) in &inputs {
        let created = instance
            .methods()
            .create_campaign(*tg, *dl)
            .call()
            .await
            .unwrap()
            .value;
        // IDs should increment starting at 1
        assert!(created >= 1 && created <= 3);
    }

    // List and validate
    let list = instance
        .methods()
        .list_campaigns()
        .call()
        .await
        .unwrap()
        .value;

    assert_eq!(list.len(), inputs.len());

    for (idx, c) in list.iter().enumerate() {
        let (expected_goal, expected_deadline) = inputs[idx];
        assert_eq!(c.id, (idx as u64) + 1);
        assert_eq!(c.target_goal, expected_goal);
        assert_eq!(c.deadline, expected_deadline);
        assert_eq!(c.total_raised, 0);
        assert!(c.asset_id.is_none());

        // Owner should be the wallet address used to deploy/call
        let owner_addr = instance
            .methods()
            .get_campaign_owner_addr(c.id)
            .call()
            .await
            .unwrap()
            .value
            .expect("owner should be an Address");
        assert_eq!(owner_addr, wallet.address().into());
    }
}

#[tokio::test]
async fn test_get_campaign_optional_returns_none_and_some() {
    let (instance, _id, wallet) = get_contract_instance().await;

    // Before creation, id 1 should not exist
    let res_none = instance
        .methods()
        .get_campaign(1)
        .call()
        .await
        .unwrap()
        .value;
    assert!(res_none.is_none());

    // Create a campaign
    let target_goal: u64 = 10_000;
    let deadline: u64 = 55_555;
    let created_id = instance
        .methods()
        .create_campaign(target_goal, deadline)
        .call()
        .await
        .unwrap()
        .value;
    assert_eq!(created_id, 1);

    // Now id 1 should exist
    let res_some = instance
        .methods()
        .get_campaign(1)
        .call()
        .await
        .unwrap()
        .value
        .expect("expected Some(campaign)");

    assert_eq!(res_some.id, 1);
    assert_eq!(res_some.target_goal, target_goal);
    assert_eq!(res_some.deadline, deadline);
    assert_eq!(res_some.total_raised, 0);
    assert!(res_some.asset_id.is_none());

    // Owner equals msg_sender (wallet)
    let owner_addr = instance
        .methods()
        .get_campaign_owner_addr(1)
        .call()
        .await
        .unwrap()
        .value
        .expect("owner should be an Address");
    assert_eq!(owner_addr, wallet.address().into());

    // Next id should still be 2, so id 2 is None
    let res_none_2 = instance
        .methods()
        .get_campaign(2)
        .call()
        .await
        .unwrap()
        .value;
    assert!(res_none_2.is_none());
}
