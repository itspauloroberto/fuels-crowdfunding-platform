use fuels::{prelude::*, types::ContractId};
// No extra types required for current interface

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
    let campaign = instance
        .methods()
        .get_campaign(created_id)
        .call()
        .await
        .unwrap()
        .value;

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
    let first_id = instance.methods().create_campaign(1, 10).call().await.unwrap().value;
    assert_eq!(first_id, 1);
    let next_2 = instance.methods().get_next_id().call().await.unwrap().value;
    assert_eq!(next_2, 2);

    // After another creation next_id should be 3
    let second_id = instance.methods().create_campaign(2, 20).call().await.unwrap().value;
    assert_eq!(second_id, 2);
    let next_3 = instance.methods().get_next_id().call().await.unwrap().value;
    assert_eq!(next_3, 3);
}
