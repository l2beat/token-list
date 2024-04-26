import { Logger } from '@l2beat/backend-tools'
import { AbiEvent } from 'abitype'
import { setTimeout } from 'timers/promises'
import { getAddress, GetLogsReturnType, parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { Cache } from '../cache/Cache'
import { ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

const escrows = new Map<string, `0x${string}`>([
  ['across-v2_0', '0xc186fA914353c44b2E33eBE05f21846F1048bEda'],
  ['across-v2_1', '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5'],
  ['across-v2_2', '0x4D9079Bb4165aeb4084c526a32695dCfd2F77381'],
  ['allbridge_0', '0xBBbD1BbB4f9b936C3604906D7592A644071dE884'],
  ['allbridge_1', '0xB827b15adA62D78F5cb90243bc4755cf4B9d1B0e'],
  ['allbridge_2', '0x1D3df13aDAe6cA91Fb90b977c21d6e90ad8d403C'],
  ['allbridge_3', '0xCe01bc1be28c0784492cB44EbBDa662c3F539172'],
  ['amarok_0', '0x8898B472C54c31894e3B9bb83cEA802a5d0e63C6'],
  ['amarok_1', '0xC8140dA31E6bCa19b287cC35531c2212763C2059'],
  ['ankr_0', '0xc437DF90B37C1dB6657339E31BfE54627f0e7181'],
  ['avalanche_0', '0xE78388b4CE79068e89Bf8aA7f218eF6b9AB0e9d0'],
  ['avalanche_1', '0x8EB8a3b98659Cce290402893d0123abb75E3ab28'],
  ['aptos_0', '0x50002CdFe7CCb0C41F519c6Eb0653158d11cd907'],
  ['beamer-bridge-v2_0', '0x7faEa6562a6cE991149F0167baF283E9aAc7Dc50'],
  ['cbridge_0', '0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820'],
  ['cbridge_1', '0xB37D31b2A74029B5951a2778F959282E2D518595'],
  ['cbridge_2', '0x7510792A3B1969F9307F3845CE88e39578f2bAE1'],
  ['connext_0', '0x31eFc4AeAA7c39e54A33FDc3C46ee2Bd70ae0A09'],
  ['debridge_0', '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA'],
  ['davos_0', '0x6DeF4570251E1f435E121b3Ee47174496D851C99'],
  ['gravity_0', '0xa4108aA1Ec4967F8b52220a4f7e94A8201F2D906'],
  ['harmony_0', '0xF9Fb1c508Ff49F78b60d3A96dea99Fa5d7F3A8A6'],
  ['harmony_1', '0xfD53b1B4AF84D59B20bF2C20CA89a6BeeAa2c628'],
  ['harmony_2', '0x2dCCDB493827E15a5dC8f8b72147E6c4A5620857'],
  ['chainport_0', '0x7B8FDfCf79E72a9a8e656958647D139C0e16EA19'],
  ['chainport_1', '0x450aD18B4442ce2972Af2a7A12439984db4Afaf9'],
  ['chainport_2', '0xD2238E8c085E5059F8DFC52256530210bc7250F6'],
  ['chainport_3', '0x873089bC765a1C0AFAd48e34fCd305d17D81be87'],
  ['chainport_4', '0x763A0CA93AF05adE98A52dc1E5B936b89bF8b89a'],
  ['chainport_5', '0x894107B7b5051409f279E8300774B2f62Febe057'],
  ['chainport_6', '0xfE83475880d3592833249BAAacfEC5eD51E29D82'],
  ['hop_0', '0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'],
  ['hop_1', '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'],
  ['hop_2', '0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'],
  ['hop_3', '0xb8901acB165ed027E32754E0FFe830802919727f'],
  ['hop_4', '0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'],
  ['hop_5', '0x914f986a44AcB623A277d6Bd17368171FCbe4273'],
  ['hop_6', '0x893246FACF345c99e4235E5A7bbEE7404c988b96'],
  ['hyphen_0', '0x2A5c2568b10A0E826BfA892Cf21BA7218310180b'],
  ['immutablezkevm_0', '0xBa5E35E26Ae59c7aea6F029B68c6460De2d13eB6'],
  ['lzomnichain_0', '0x7122985656e38BDC0302Db86685bb972b145bD3C'],
  ['lzomnichain_1', '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6'],
  ['lzomnichain_2', '0x92CC36D66e9d739D50673d1f27929a371FB83a67'],
  ['lzomnichain_3', '0x4Fa745FCCC04555F2AFA8874cd23961636CdF982'],
  ['lzomnichain_4', '0xEe381e476b4335B8584A2026f3E845edaC2c69de'],
  ['lzomnichain_5', '0x4F52b41a778761bd2EEa5b7b7ed8cBDAA02cEF3E'],
  ['lzomnichain_6', '0x1A36E24D61BC1aDa68C21C2Da1aD53EaB8E03e55'],
  ['lzomnichain_7', '0xB0003eB166654f7e57c0463F8D1a438eB238c490'],
  ['lzomnichain_8', '0x6F537839714761388B6d7ED61Bc09579d5dA2F41'],
  ['multichain_0', '0x0615Dbba33Fe61a31c7eD131BDA6655Ed76748B1'],
  ['multichain_1', '0x0914D4CCc4154cA864637B0B653Bc5Fd5e1d3ecF'],
  ['multichain_2', '0x0aC06321050Defb485340c3509A5405F9d7655c7'],
  ['multichain_3', '0x0bd19f6447cd676255C7C7B00428462B3dA67e3a'],
  ['multichain_4', '0x0E1b539Eaf71d5D025f8ce90cA2256b4Cf3e94B1'],
  ['multichain_5', '0x10c6b61DbF44a083Aec3780aCF769C77BE747E23'],
  ['multichain_6', '0x11eb3aA66FE1f2B75cB353D3e874E96968182BdA'],
  ['multichain_7', '0x13B432914A996b0A48695dF9B2d701edA45FF264'],
  ['multichain_8', '0x15a3FE3e6B8a5C01b1BfE72C76660C897368Eec0'],
  ['multichain_9', '0x16abA2d28329620F31D44748EC82FA08daA50B86'],
  ['multichain_10', '0x183D0dC5867c01bFB1dbBc41d6a9d3dE6e044626'],
  ['multichain_11', '0x1Cb1284CF62C3E593a8f49EEf3db37AD20467Bed'],
  ['multichain_12', '0x22648C12acD87912EA1710357B1302c6a4154Ebc'],
  ['multichain_13', '0x2AC03BF434db503f6f5F85C3954773731Fc3F056'],
  ['multichain_14', '0x2F10c5eE93ac666dA72195abA8a49FD6D27fA02F'],
  ['multichain_15', '0x353B98DDc927173005dD8B293B043Bd950cDA468'],
  ['multichain_16', '0x3696f44F2B7FE51486f81D2639Ff895202614711'],
  ['multichain_17', '0x373590a576ccb8143f377DB5f1c16F9f8528a8B4'],
  ['multichain_18', '0x37C24675E4a0DFCE683c51e1746599F1E2517Eb5'],
  ['multichain_19', '0x3D632d9e1a60a0880Dd45E61f279D919b5748377'],
  ['multichain_20', '0x403BEB734e0C7E87D632a4EA1B290059E3B3A3c9'],
  ['multichain_21', '0x46290B0c3A234E3d538050d8F34421797532A827'],
  ['multichain_22', '0x4a0A3902e091cdb3AEc4279a6BFAC50297F0A79e'],
  ['multichain_23', '0x4e1581f01046eFDd7a1a2CDB0F82cdd7F71F2E59'],
  ['multichain_24', '0x4E67df0f232C3bc985F8a63326D80ce3d9A40400'],
  ['multichain_25', '0x4e840AADD28DA189B9906674B4Afcb77C128d9ea'],
  ['multichain_26', '0x4f60a160D8C2DDdaAfe16FCC57566dB84D674BD6'],
  ['multichain_27', '0x533e3c0e6b48010873B947bddC4721b1bDFF9648'],
  ['multichain_28', '0x55F089d5f6aeDfdACBD5E3aCB0e8F31FBAb44088'],
  ['multichain_29', '0x57ed6BD35a6CE815079855CD0b21331d1D5D0A0e'],
  ['multichain_30', '0x6362496Bef53458b20548a35A2101214Ee2BE3e0'],
  ['multichain_31', '0x65e64963b755043CA4FFC88029FfB8305615EeDD'],
  ['multichain_32', '0x668b9734FfE9eE8a01d4Ade3362De71E8989EA87'],
  ['multichain_33', '0x685b63CFE0179b3EFb70A01dCb1D648549AA192d'],
  ['multichain_34', '0x739ca6D71365a08f584c8FC4e1029045Fa8ABC4B'],
  ['multichain_35', '0x7BEB05cf5681f402E762F8569c2Fc138a2172978'],
  ['multichain_36', '0x7EA2be2df7BA6E54B1A9C70676f668455E329d29'],
  ['multichain_37', '0x7F923dB3d90047D75D078e29b1f8Eac03e30F761'],
  ['multichain_38', '0x820A9eb227BF770A9dd28829380d53B76eAf1209'],
  ['multichain_39', '0x87bCB3038988ca2A89605fFa8f237FB78Df1c3Ae'],
  ['multichain_40', '0x896be9f48b225154593A84b382d927F9d7Bc2361'],
  ['multichain_41', '0x8b92eA35171e29948Cc9e49c52AC8dB0549B7D6B'],
  ['multichain_42', '0x8BB9Cac776555E0Ac707024Ed729E5AACeAfBE72'],
  ['multichain_43', '0x8cC49FE67A4bD7a15674c4ffD4E969D94304BBbf'],
  ['multichain_44', '0x8dFDC61c7c7551D0DEec950A2822eB59cddb8f59'],
  ['multichain_45', '0x923e0a17F49Fb03d936F2af2D59D379C615f5447'],
  ['multichain_46', '0x92804831aC036Ca77D57Db8BBA0E522Cd35a8049'],
  ['multichain_47', '0x944A05c5acC46c9777ACA7d8dD92B048b1b6D3e0'],
  ['multichain_48', '0x95555E4e4CB2C094914aF53598eFf14b9340881f'],
  ['multichain_49', '0x97cFFC8aaDC28cda8Ba901667222d6386A46f705'],
  ['multichain_50', '0x9c1F1f8d03f5cca7a5D31b56D90c967B1D8cFAb7'],
  ['multichain_51', '0xA024856a51B1D8bFBbc78DDbc98e6d5b94dc24c4'],
  ['multichain_52', '0xA5432cbF7097C4E3536731dEc837e3fA676b38C3'],
  ['multichain_53', '0xa65779AA9a29af831DA49c48899e7146934905C7'],
  ['multichain_54', '0xaBDA031246BD1De3D7b683455506D3d74a0E1a5B'],
  ['multichain_55', '0xB01371072fDcB9B4433b855e16A682B461F94AB3'],
  ['multichain_56', '0xbbc4A8d076F4B1888fec42581B6fc58d242CF2D5'],
  ['multichain_57', '0xbd40733A2F223fF32195a759a81df25E35DD4dEA'],
  ['multichain_58', '0xBe008e52c5682A49dd0260735a26Aa221f303456'],
  ['multichain_59', '0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE'],
  ['multichain_60', '0xcaF5191fc480F43e4DF80106c7695ECA56E48B18'],
  ['multichain_61', '0xcb9d0b8CfD8371143ba5A794c7218D4766c493e2'],
  ['multichain_62', '0xCDd83050f045ab31B884f0Dc49581BC7b3e0B84C'],
  ['multichain_63', '0xCfa8F0Aed0414A98f99f1Ea29ddF23f6E1370c13'],
  ['multichain_64', '0xcFD5868fbF612bd8907827f012d71f3C7BA6C943'],
  ['multichain_65', '0xd13eB71515DC48a8a367D12F844e5737bab415dF'],
  ['multichain_66', '0xD22e210785902c39B579565e931517E5Bd34A69a'],
  ['multichain_67', '0xD779967F8B511C5edf39115341B310022900eFED'],
  ['multichain_68', '0xDd98B79b36c77Ee1F23f37B61e58A61cc3D5aceF'],
  ['multichain_69', '0xE4cf417081A0Ab3f964b44D904BC2b534351A9a7'],
  ['multichain_70', '0xe5CF1558A1470cb5C166c2e8651eD0F3c5fb8F42'],
  ['multichain_71', '0xE6B9d092223f39013656702A40dbE6B7DeCc5746'],
  ['multichain_72', '0xeA928a8d09E11c66e074fBf2f6804E19821F438D'],
  ['multichain_73', '0xeBE58381406D2c9BC9F68f541D503bA4F1A29fDF'],
  ['multichain_74', '0xEC4486a90371c9b66f499Ff3936F29f0D5AF8b7E'],
  ['multichain_75', '0xee9762352f63f4387af40D58291612067727457D'],
  ['multichain_76', '0xF49818b5d7dE5B0DBfcCb3Ddcd14e1f0AA1A6f01'],
  ['multichain_77', '0xF62385C78f3BDBff33145703546b0377853AAa77'],
  ['multichain_78', '0xf751575ED3390f6C02B4358f9E165e7B44877032'],
  ['multichain_79', '0xFaFA220145DfA5C3Ec85B6FA8a75aEE2451CDe5E'],
  ['multichain_80', '0xFc7cc7C7e7985316d23104B9689C511134f59bc8'],
  ['near_0', '0x23Ddd3e3692d1861Ed57EDE224608875809e127f'],
  ['near_1', '0x6BFaD42cFC4EfC96f529D786D643Ff4A8B89FA52'],
  ['nomad_0', '0x88A69B4E698A4B090DF6CF5Bd7B2D47325Ad30A3'],
  ['omni_0', '0x88ad09518695c6c3712AC10a214bE5109a655671'],
  ['opticsV1_0', '0x6a39909e805A3eaDd2b61fFf61147796ca6aBB47'],
  ['opticsV2_0', '0x4fc16De11deAc71E8b2Db539d82d93BE4b486892'],
  ['orbit_0', '0x1Bf68A9d1EaEe7826b3593C20a0ca93293cb489a'],
  ['orbit_1', '0xBe03a2569d10fd10bDbfE84f5f2E22D9cec4aCd0'],
  ['orbit_2', '0x830433dE03ABedE062660CC629e1A2c714272474'],
  ['orbit_3', '0xd910f6F23889919fAd9C8cE3171dd557cE0308Da'],
  ['orbiter_0', '0x80C67432656d59144cEFf962E8fAF8926599bCF8'],
  ['orbiter_1', '0x41d3D33156aE7c62c094AAe2995003aE63f587B3'],
  ['orbiter_2', '0xd7Aa9ba6cAAC7b0436c91396f22ca5a7F31664fC'],
  ['orbiter_3', '0x095D2918B03b2e86D68551DCF11302121fb626c9'],
  ['polygon-plasma_0', '0x401F6c983eA34274ec46f84D70b31C151321188b'],
  ['polygon-pos_0', '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf'],
  ['polygon-pos_1', '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30'],
  ['polygon-pos_2', '0x21ada4D8A799c4b0ADF100eB597a6f1321bCD3E4'],
  ['polynetwork_0', '0x250e76987d838a75310c34bf422ea9f1AC4Cc906'],
  ['polynetwork_1', '0x53D23ba1c38D6ECf2B7f213F7CF22b17AE3BB868'],
  ['pNetwork_0', '0xe396757EC7E6aC7C8E5ABE7285dde47b98F22db8'],
  ['pNetwork_1', '0x9f8622b11984AfC8f0a42A394928702017c5968D'],
  ['pNetwork_2', '0x112334f50Cb6efcff4e35Ae51A022dBE41a48135'],
  ['pulseChain_0', '0x1715a3E4A142d8b698131108995174F37aEBA10D'],
  ['ronin_0', '0x1A2a1c938CE3eC39b6D47113c7955bAa9DD454F2'],
  ['ronin_1', '0x64192819Ac13Ef72bF6b5AE239AC672B43a9AF08'],
  ['satellite_0', '0x4F4495243837681061C4743b74B3eEdf548D56A5'],
  ['skale-ima_0', '0x49F583d263e4Ef938b9E09772D3394c71605Df94'],
  ['skale-ima_1', '0x8fB1A35bB6fB9c47Fb5065BE5062cB8dC1687669'],
  ['socket_0', '0x6D303CEE7959f814042D31E0624fB88Ec6fbcC1d'],
  ['sollet_0', '0xeae57ce9cc1984F202e15e038B964bb8bdF7229a'],
  ['stargate_0', '0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56'],
  ['stargate_1', '0x38EA452219524Bb87e18dE1C24D3bB59510BD783'],
  ['stargate_2', '0x692953e758c3669290cb1677180c64183cEe374e'],
  ['stargate_3', '0x0Faf1d2d3CED330824de3B8200fc8dc6E397850d'],
  ['stargate_4', '0xfA0F307783AC21C39E939ACFF795e27b650F6e68'],
  ['stargate_5', '0xE8F55368C82D38bbbbDb5533e7F56AfC2E978CC2'],
  ['stargate_6', '0xd8772edBF88bBa2667ed011542343b0eDDaCDa47'],
  ['stargate_7', '0x430Ebff5E3E80A6C58E7e6ADA1d90F5c28AA116d'],
  ['stargate_8', '0x1CE66c52C36757Daf6551eDc04800A0Ec9983A09'],
  ['stargate_9', '0xA572d137666DCbAdFA47C3fC41F15e90134C618c'],
  ['stargate_10', '0x72E2F4830b9E45d52F80aC08CB2bEC0FeF72eD9c'],
  ['sygma_0', '0xC832588193cd5ED2185daDA4A531e0B26eC5B830'],
  ['synapse_0', '0x2796317b0fF8538F253012862c06787Adfb8cEb6'],
  ['synapse_1', '0x1116898DdA4015eD8dDefb84b6e8Bc24528Af2d8'],
  ['portal_0', '0x3ee18B2214AFF97000D974cf647E7C347E8fa585'],
  ['wormholeV1_0', '0xf92cD566Ea4864356C5491c177A430C222d7e678'],
  ['xdai_0', '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016'],
  ['symbiosis_0', '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8'],
  ['aevo_0', '0x787A0ACaB02437c60Aafb1a29167A3609801e320'],
  ['aevo_1', '0x4082C9647c098a6493fb499EaE63b5ce3259c574'],
  ['ancient_0', '0x639F2AECE398Aa76b07e59eF6abe2cFe32bacb68'],
  ['ancient_1', '0x12d4E64E1B46d27A00fe392653A894C1dd36fb80'],
  ['apex_0', '0xA1D5443F2FB80A5A55ac804C948B45ce4C52DCbb'],
  ['apex_1', '0xe53A6eD882Eb3f90cCe0390DDB04c876C5482E6b'],
  ['arbitrum_0', '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a'],
  ['arbitrum_1', '0xcEe284F754E854890e311e3280b767F80797180d'],
  ['arbitrum_2', '0xa3A7B6F88361F48403514059F1F16C8E78d60EeC'],
  ['arbitrum_3', '0xA10c7CE4b876998858b1a9E12b10092229539400'],
  ['arbitrum_4', '0x0F25c1DC2a9922304f2eac71DCa9B07E310e8E5a'],
  ['arbitrum_5', '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515'],
  ['aztec_0', '0x737901bea3eeb88459df9ef1BE8fF3Ae1B42A2ba'],
  ['aztecconnect_0', '0xFF1F2B4ADb9dF6FC8eAFecDcbF96A2B351680455'],
  ['base_0', '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e'],
  ['base_1', '0x3154Cf16ccdb4C6d922629664174b904d80F2C35'],
  ['base_2', '0x9de443AdC5A411E83F1878Ef24C3F52C61571e72'],
  ['blast_0', '0x0Ec68c5B10F21EFFb74f2A5C61DFe6b08C0Db6Cb'],
  ['blast_1', '0x697402166Fbf2F22E970df8a6486Ef171dbfc524'],
  ['blast_2', '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d'],
  ['blast_3', '0x98078db053902644191f93988341E31289E1C8FE'],
  ['blast_4', '0xa230285d5683C74935aD14c446e137c8c8828438'],
  ['bobanetwork_0', '0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00'],
  ['bobanetwork_1', '0x1A26ef6575B7BBB864d984D9255C069F6c361a14'],
  ['canvasconnect_0', '0x7A7f9c8fe871cd50f6Ce935d7c7caD2e89987f9d'],
  ['honeypot_0', '0x0974CC873dF893B302f6be7ecf4F9D4b1A15C366'],
  ['degate_0', '0x814d0c1903D69EB1c7ceB8F5190B20A06892d1dA'],
  ['degate2_0', '0xF13e21653AEB763595D5E4baA1dC115689Da49b9'],
  ['degate3_0', '0x54D7aE423Edb07282645e740C046B9373970a168'],
  ['dydx_0', '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'],
  ['fraxtal_0', '0x36cb65c1967A0Fb0EEE11569C51C2f2aA1Ca6f6D'],
  ['fraxtal_1', '0x34C0bD5877A5Ee7099D0f5688D65F4bB9158BDE2'],
  ['fuelv1_0', '0x6880f6Fd960D1581C2730a451A22EED1081cfD72'],
  ['gluon_0', '0x75ACe7a086eA0FB1a79e43Cc6331Ad053d8C67cB'],
  ['gluon_1', '0x84e34fD82FC368F1a072075114AdC4b552a7a1F4'],
  ['hermez_0', '0xA68D85dF56E733A06443306A095646317B5Fa633'],
  ['hychain_0', '0x73C6af7029E714DFf1F1554F88b79B335011Da68'],
  ['hypr_0', '0xba1ac896F3b7cB273daE94bF9A6291A432e826c7'],
  ['hypr_1', '0x1bBde518ad01BaABFE30020407A7630FB17B545d'],
  ['immutablex_0', '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9'],
  ['karak_0', '0xeeCE9CD7Abd1CC84d9dfc7493e7e68079E47eA73'],
  ['karak_1', '0xBA61F25dd9f2d5f02D01B1C2c1c5F0B14c4B48A3'],
  ['kinto_0', '0x859a53Fe2C8DA961387030E7CB498D6D20d0B2DB'],
  ['kinto_1', '0x0f1b7bd7762662B23486320AA91F30312184f70C'],
  ['kinto_2', '0x7870D5398DB488c669B406fBE57b8d05b6A35e42'],
  ['kinto_3', '0x1A6773b61C111064F44C4C93F141793b31dF3442'],
  ['kinto_4', '0xD81019beaa5D335e6fb40DdFf8a9cef21b49821f'],
  ['kroma_0', '0x31F648572b67e60Ec6eb8E197E1848CC5F5558de'],
  ['kroma_1', '0x827962404D7104202C5aaa6b929115C8211d9596'],
  ['kroma_2', '0x7e1Bdb9ee75B6ef1BCAAE3B1De1c616C7B11ef6e'],
  ['layer2finance_0', '0xf86FD6735f88d5b6aa709B357AD5Be22CEDf1A05'],
  ['layer2financezk_0', '0x82123571C8a5e0910280C066bc634c4945FFcbC8'],
  ['layer2financezk_1', '0x8581cd55ff53F1F85A237fa9D60E72a79f0973b6'],
  ['layer2financezk_2', '0x4455E4435Cf7e6B6A4Df17bEAE1A413ef3663B90'],
  ['layer2financezk_3', '0x3F3b821243E5664822c0babBA2B4f37bf294e7a0'],
  ['linea_0', '0xd19d4B5d358258f05D7B411E21A1460D11B0876F'],
  ['linea_1', '0x504A330327A089d8364C4ab3811Ee26976d388ce'],
  ['linea_2', '0x051F1D88f0aF5763fB888eC4378b4D8B29ea3319'],
  ['loopring_0', '0x7D3D221A8D8AbDd868E8e88811fFaF033e68E108'],
  ['loopring_1', '0xD97D09f3bd931a14382ac60f156C1285a56Bb51B'],
  ['loopring_2', '0x674bdf20A0F284D710BC40872100128e2d66Bd3f'],
  ['lyra_0', '0x85eA9c11cf3D4786027F7FD08F4406b15777e5f8'],
  ['lyra_1', '0x61E44dC0dae6888B5a301887732217d5725B0bFf'],
  ['mantapacific_0', '0x9168765EE952de7C6f8fC6FaD5Ec209B960b7622'],
  ['mantapacific_1', '0x3B95bC951EE0f553ba487327278cAc44f29715E5'],
  ['mantle_0', '0xc54cb22944F2bE476E02dECfCD7e3E7d3e15A8Fb'],
  ['mantle_1', '0x95fC37A27a2f68e3A647CDc081F0A89bb47c3012'],
  ['metis_0', '0x3980c9ed79d2c191A89E02Fa3529C60eD6e9c04b'],
  ['mode_0', '0x8B34b14c7c7123459Cf3076b8Cb929BE097d0C07'],
  ['mode_1', '0x735aDBbE72226BD52e818E7181953f42E3b0FF21'],
  ['myria_0', '0x3071BE11F9e92A9eb28F305e1Fa033cD102714e7'],
  ['nova_0', '0xC1Ebd02f738644983b6C4B2d440b8e77DdE276Bd'],
  ['nova_1', '0xA2e996f0cb33575FA0E36e8f62fCd4a9b897aAd3'],
  ['nova_2', '0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf'],
  ['omgnetwork_0', '0x3Eed23eA148D356a72CA695DBCe2fceb40a32ce0'],
  ['omgnetwork_1', '0x070cB1270A4B2bA53c81CeF89d0FD584Ed4F430B'],
  ['optimism_0', '0xbEb5Fc579115071764c7423A4f12eDde41f106Ed'],
  ['optimism_1', '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1'],
  ['optimism_2', '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65'],
  ['optimism_3', '0x5Fd79D46EBA7F351fe49BFF9E87cdeA6c821eF9f'],
  ['optimism_4', '0x045e507925d2e05D114534D0810a1abD94aca8d6'],
  ['optimism_5', '0xCd9D4988C0AE61887B075bA77f08cbFAd2b65068'],
  ['optimism_6', '0x76943C0D61395d8F2edF9060e1533529cAe05dE6'],
  ['orderly_0', '0x91493a61ab83b62943E6dCAa5475Dd330704Cc84'],
  ['orderly_1', '0xe07eA0436100918F157DF35D01dCE5c11b16D1F1'],
  ['paradex_0', '0xE3cbE3A636AB6A754e9e41B12b09d09Ce9E53Db3'],
  ['parallel_0', '0x5a961c7D162195a9Dc5a357Cc168b0694283382E'],
  ['parallel_1', '0x6Eb9240d4add111D5Fc81b10Ff12eECabcf9752d'],
  ['parallel_2', '0xa1c86E2362dba0525075622af6d5f739B1304D45'],
  ['parallel_3', '0x150286BdbE7C8Cd23D41a8e1e64438e0dc04dc3d'],
  ['polygonzkevm_0', '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe'],
  ['polygonzkevm_1', '0xf0CDE1E7F0FAD79771cd526b1Eb0A12F69582C01'],
  ['polygonzkevm_2', '0x70E70e58ed7B1Cec0D8ef7464072ED8A52d755eB'],
  ['polygonzkevm_3', '0x4A27aC91c5cD3768F140ECabDe3FC2B2d92eDb98'],
  ['publicgoodsnetwork_0', '0xb26Fd985c5959bBB382BAFdD0b879E149e48116c'],
  ['publicgoodsnetwork_1', '0xD0204B9527C1bA7bD765Fa5CCD9355d38338272b'],
  ['reddioex_0', '0xB62BcD40A24985f560b5a9745d478791d8F1945C'],
  ['deversifi_0', '0x5d22045DAcEAB03B158031eCB7D9d06Fad24609b'],
  ['rss3_0', '0x6A12432491bbbE8d3babf75F759766774C778Db4'],
  ['rss3_1', '0x4cbab69108Aa72151EDa5A3c164eA86845f18438'],
  ['scroll_0', '0xD8A791fE2bE73eb6E6cF1eb0cb3F36adC9B3F8f9'],
  ['scroll_1', '0x6774Bcbd5ceCeF1336b5300fb5186a12DDD8b367'],
  ['scroll_2', '0xb2b10a289A229415a124EFDeF310C10cb004B6ff'],
  ['scroll_3', '0xf1AF3b23DE0A5Ca3CAb7261cb0061C0D779A5c7B'],
  ['sorare_0', '0xF5C9F957705bea56a7e806943f98F7777B995826'],
  ['starknet_0', '0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419'],
  ['starknet_1', '0x0437465dfb5B79726e35F08559B0cBea55bb585C'],
  ['starknet_2', '0x283751A21eafBFcD52297820D27C1f1963D9b5b4'],
  ['starknet_3', '0xF6080D9fbEEbcd44D89aFfBFd42F098cbFf92816'],
  ['starknet_4', '0xbb3400F107804DFB482565FF1Ec8D8aE66747605'],
  ['starknet_5', '0xBf67F59D2988A46FBFF7ed79A621778a3Cd3985B'],
  ['starknet_6', '0xcf58536D6Fab5E59B654228a5a4ed89b13A876C2'],
  ['starknet_7', '0xf76e6bF9e2df09D0f854F045A3B724074dA1236B'],
  ['starknet_8', '0xDc687e1E0B85CB589b2da3C47c933De9Db3d1ebb'],
  ['starknet_9', '0x66ba83ba3D3AD296424a2258145d9910E9E40B7C'],
  ['starknet_10', '0xd8E8531fdD446DF5298819d3Bc9189a5D8948Ee8'],
  ['starknet_11', '0xF3F62F23dF9C1D2C7C63D9ea6B90E8d24c7E3DF5'],
  ['starknet_12', '0x023A2aAc5d0fa69E3243994672822BA43E34E5C9'],
  ['starknet_13', '0xcE5485Cfb26914C5dcE00B9BAF0580364daFC7a4'],
  ['brine_0', '0x1390f521A79BaBE99b69B37154D63D431da27A07'],
  ['zkfair_0', '0x9cb4706e20A18E59a48ffa7616d700A3891e1861'],
  ['zkspace_0', '0x5CDAF83E077DBaC2692b5864CA18b61d67453Be8'],
  ['zkswap_0', '0x8ECa806Aecc86CE90Da803b080Ca4E3A9b8097ad'],
  ['zkswap2_0', '0x6dE5bDC580f55Bc9dAcaFCB67b91674040A247e3'],
  ['zksync2_0', '0x32400084C286CF3E17e7B677ea9583e60a000324'],
  ['zksync2_1', '0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063'],
  ['zksync_0', '0xaBEA9132b05A70803a4E85094fD0e1800777fBEF'],
  ['zora_0', '0x1a0ad011913A150f69f6A19DF447A0CfD9551054'],
  ['zora_1', '0x3e2Ea9B92B7E48A52296fD261dc26fd995284631'],
])

type AddressType = TokenListing['address']

export class EscrowSource implements TokenSource {
  private readonly cache: Cache<AddressType[]>

  constructor(
    private readonly publicClient: PublicClient,
    private readonly chain: ChainConfig,
    private readonly logger: Logger,
  ) {
    this.cache = new Cache<AddressType[]>(`escrow-addresses-${chain.id}.json`)
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const { number: toBlock } = await this.publicClient.getBlock({
      includeTransactions: false,
      blockTag: 'latest',
    })
    const event = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )

    const result: TokenListing[] = []
    let index = 0
    for (const [name, address] of escrows) {
      const cached = this.cache.get(address)

      let tokens
      if (cached) {
        tokens = cached
      } else {
        const logs = await this.getLogsRecursive(this.publicClient, {
          event,
          args: { to: address },
          fromBlock: 0n,
          toBlock: toBlock,
        })

        tokens = [
          ...new Set(
            logs.map((x) =>
              Address(`${this.chain.prefix}:${getAddress(x.address)}`),
            ),
          ),
        ]
        this.cache.set(address, tokens)
      }

      for (const token of tokens) {
        result.push({
          address: token,
          inEscrow: {
            [name]: Address(`${this.chain.prefix}:${address}`),
          },
          tags: {
            escrow: true,
          },
        })
      }

      this.logger.info(`(${index}/${escrows.size}):${name}`, {
        tokens: tokens.length,
      })
      index += 1
    }

    return [...new Set(result)]
  }

  async getLogsRecursive<T extends AbiEvent>(
    client: PublicClient,
    args: Parameters<(typeof client)['getLogs']>[0] & {
      event: T
      fromBlock: bigint
      toBlock: bigint
    },
  ): Promise<GetLogsReturnType<T, undefined, undefined, bigint, bigint>> {
    await setTimeout(1000 / 50)
    if (args.fromBlock === args.toBlock) {
      return await client.getLogs(args as any)
    }
    try {
      const logs = await client.getLogs(args as any)
      return logs
    } catch (e) {
      this.logger.info('Failed', { from: args.fromBlock, to: args.toBlock })
      if (
        e instanceof Error &&
        e.message.includes('Log response size exceeded')
      ) {
        const midPoint = args.fromBlock + (args.toBlock - args.fromBlock) / 2n
        const [a, b] = await Promise.all([
          this.getLogsRecursive(client, { ...args, toBlock: midPoint }),
          this.getLogsRecursive(client, { ...args, fromBlock: midPoint + 1n }),
        ])
        return a.concat(b)
      } else {
        throw e
      }
    }
  }
}
