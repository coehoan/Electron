<script>
    import {companySeq} from "../../../scripts/store/store";
    import {onDestroy, onMount} from "svelte";
    import Header from "../../lib/layout/Header.svelte";
    import {DialogType, MainTitle} from "../../../scripts/util/enum";
    import {emailCheck} from "../../../scripts/util/common";

    let title = MainTitle.CompanyInfo;
    let companyInfo = [];
    let newAdminList =[];

    let dialogOption = {
        option: {
            type: '',
            buttons: [],
            defaultId: 0,
            title: '',
            message: '',
            detail: '',
        }
    }

    onMount(() => {
        window.api.response('infoResponse', (data) => {
            companyInfo = data;
        })
        window.api.request('getCompanyInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('infoResponse');
        window.api.removeResponse('adminResponse');
    })

    /**
     * 담당자 입력창 추가
     * */
    function addAdminList() {
        let adminInfo = {
            basic_info_seq: 1,
            company_seq: $companySeq,
            name: '',
            roles: '',
            email: '',
            tel: '',
            phone: '',
            type: ''
        }
        newAdminList = [...newAdminList, adminInfo];
    }

    /**
     * 담당자 입력창 삭제
     * */
    function removeAdminList(e) {
        newAdminList.splice(e, 1);
        newAdminList = newAdminList;
    }

    /**
     * 담당자 삭제
     * */
    function deleteAdmin (e) {
        if (companyInfo.length <= 1) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '1명 이상의 담당자 정보가 필요합니다.',
                }
            }
            window.api.request('dialog', dialogOption);
        } else {
            window.api.response('adminResponse', (data) => {
                if (data) {
                    newAdminList = [];
                    // 담당자 저장, 삭제 성공 후 목록 재조회
                    window.api.request('getCompanyInfo');
                }
            })
            window.api.request('deleteAdmin', e);
        }
    }

    function validCheck() {
        if (!newAdminList.every((e) => !Object.values(e).includes(''))) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '빈 값을 확인해주세요.',
                }
            }
            window.api.request('dialog', dialogOption);
            return false;
        }
        for (let i = 0; i < newAdminList.length; i++) {
            if (!emailCheck(newAdminList[i].email)) {
                dialogOption = {
                    option: {
                        type: DialogType.Info,
                        buttons: [],
                        defaultId: 0,
                        title: '알림',
                        message: '',
                        detail: '이메일 양식을 확인해주세요.',
                    }
                }
                window.api.request('dialog', dialogOption);
                return false;
            }
        }
        return true;
    }

    /**
     * 담당자 저장
     * */
    function saveAdmin() {
        if (validCheck()) {
            window.api.response('adminResponse', (data) => {
                if (data === 'duplicated') {
                    dialogOption = {
                        option: {
                            type: DialogType.Info,
                            buttons: [],
                            defaultId: 0,
                            title: '알림',
                            message: '',
                            detail: '주담당자는 1명만 지정 가능합니다.',
                        }
                    }
                    window.api.request('dialog', dialogOption);
                } else if (data) {
                    newAdminList = [];
                    // 담당자 저장, 삭제 성공 후 목록 재조회
                    window.api.request('getCompanyInfo');
                }
                window.api.removeResponse('adminResponse');
            })
            window.api.request('saveAdmin', newAdminList);
        }
    }

</script>

<main>
    <Header {title}/>
    <h3>기관정보</h3>
    {#if companyInfo.length > 0}
        <ul>
            <li>기관명: {companyInfo[0].name}</li>
            <li>주소: {companyInfo[0].address}</li>
            <li>기관코드: {companyInfo[0].code}</li>
            <li>타입: {companyInfo[0].company_type}</li>
        </ul>
    {/if}
    <h3>담당자 정보</h3>
    {#if companyInfo.length > 0}
        <table>
            <thead>
            <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>
                    <button on:click={addAdminList} style="width: 100px">추가</button>
                </th>
            </tr>
            <tr>
                <th>이름</th>
                <th>직급</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>휴대폰</th>
                <th>분류</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {#each companyInfo as info}
                <tr>
                    <td>{info.admin_name}</td>
                    <td>{info.roles}</td>
                    <td>{info.email}</td>
                    <td>{info.tel}</td>
                    <td>{info.phone}</td>
                    <td>{info.type}</td>
                    <td><button on:click={() => {deleteAdmin(info.id)}}>삭제</button></td>
                </tr>
            {/each}
            {#if newAdminList.length > 0}
                {#each newAdminList as list, index}
                    <tr>
                        <td>
                            <input bind:value={list.name} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.roles} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.email} style="width: 150px;" type="email"/>
                        </td>
                        <td>
                            <input bind:value={list.tel} on:input={() => {list.tel = list.tel.replace(/[^0-9]/g,'')}} maxlength="11" style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.phone} on:input={() => {list.phone = list.phone.replace(/[^0-9]/g,'')}} maxlength="11" style="width: 150px;" />
                        </td>
                        <td>
                            <select bind:value={list.type} style="width: 150px">
                                <option value="주담당자">주담당자</option>
                                <option value="부담당자">부담당자</option>
                                <option value="기타">기타</option>
                            </select>
                        </td>
                        <td>
                            <button on:click={() => removeAdminList(index)}>삭제</button>
                        </td>
                    </tr>
                {/each}
            {/if}
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <button on:click={saveAdmin} style="width: 100px">저장</button>
                </td>
            </tr>
            </tbody>
        </table>
    {/if}
</main>

<style>
    tr {
        height: 50px;
    }
    td {
        text-align: center;
        width: 150px;
    }
</style>