<script>
    import {companyName, year} from "../../../scripts/store/store";
    import {push} from "svelte-spa-router";

    let companyInfo = [];
    let adminInfo = {
        name: '',
        roles: '',
        email: '',
        tel: '',
        phone: '',
        type: ''
    }
    let tableBody;

    window.api.response('info-response', (data) => {
        companyInfo = data;
    })
    window.api.request('getCompanyInfo');

    function add() {
        let element = document.createElement('tr');
        element.innerHTML += `
                <td>
                    <input bind:value={adminInfo.name} style="width: 150px;"/>
                </td>
                <td>
                    <input bind:value={adminInfo.roles} style="width: 150px;"/>
                </td>
                <td>
                    <input bind:value={adminInfo.email} style="width: 150px;"/>
                </td>
                <td>
                    <input bind:value={adminInfo.tel} style="width: 150px;"/>
                </td>
                <td>
                    <input bind:value={adminInfo.phone} style="width: 150px;"/>
                </td>
                <td>
                    <select bind:value={adminInfo.type} style="width: 150px">
                        <option value="주">주담당자</option>
                        <option value="부">부담당자</option>
                        <option value="기타">기타</option>
                    </select>
                </td>
                <td>
                    <button on:click={del}>삭제</button>
                </td>`
        tableBody.append(element);

        element.querySelector('button').addEventListener('click', del);
    }

    function del (e) {
        let parentNode = e.target.parentNode.parentNode;
        console.log(parentNode)
    }
</script>

<main>
    <h1>기관정보</h1>
    <div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
        <div style="display:flex; align-items: center; gap: 5px">
            <button on:click={() => {push('/main')}}>홈</button>
            <button on:click={() => {push('/info')}}>기관정보</button>
            <button on:click={() => {push('/self')}}>자체평가</button>
            <button on:click={() => {push('/inspect')}}>현장실사</button>
            <button on:click={() => {push('/result')}}>평가관리</button>
            <button>환경설정</button>
        </div>
        <div style="display:flex; gap: 5px">
            <p>{$year}년 </p>
            <p>{$companyName}</p>
            <p>기관 정보</p>
        </div>
    </div>
    <h3>기관정보</h3>
    {#if companyInfo.length > 0}
        <ul>
            <li>기관명: {companyInfo[0].name}</li>
            <li>주소: {companyInfo[0].address}</li>
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
                    <button on:click={add}>추가</button>
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
            <tbody bind:this={tableBody}>
            {#each companyInfo as info}
                <tr>
                    <td style="display: none">{info.id}</td>
                    <td>{info.admin_name}</td>
                    <td>{info.roles}</td>
                    <td>{info.email}</td>
                    <td>{info.tel}</td>
                    <td>{info.phone}</td>
                    <td>{info.type}</td>
                    {#if info.id > 1}
                        <td>
                            <button on:click={del}>삭제</button>
                        </td>
                    {/if}
                </tr>
            {/each}

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