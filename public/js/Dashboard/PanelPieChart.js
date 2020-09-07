/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

class PieChart extends DashboardPanelChart {
    constructor(property) {
        super();
        this.propertyToUse = property;
    }

    load(parentDivId, viewer, modelData) {
        if (!super.load(parentDivId, this.constructor.name, viewer, modelData)) return;
        // this.drawChart();
        this.drawSearch();
    }

    drawChart() {
        var _this = this; // need this for the onClick event

        var ctx = document.getElementById(this.canvasId).getContext('2d');
        if (this.chart !== undefined) this.chart.destroy();
        var colors = this.generateColors(this.modelData.getLabels(this.propertyToUse).length);

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.modelData.getLabels(this.propertyToUse),
                datasets: [{
                    data: this.modelData.getCountInstances(this.propertyToUse),
                    backgroundColor: colors.background,
                    borderColor: colors.borders,
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
                'onClick': function (evt, item) {
                    _this.viewer.isolate(_this.modelData.getIds(_this.propertyToUse, item[0]._model.label));
                    _this.viewer.utilities.fitToView();
                }
            }
        });
    }

    drawSearch() {
        var _this = this;
        var results = {
            select0: {
                selectedType: "",
                selectedBoolean: "",
                selectedItem: "",
                selectedIds: []
            }
        };
        var selectType = ["Category", "Description", "Level"];
        var selectTypeHtml = '<select class="selectTypes"><option value="">Please select</option></select>';
        var selectBoolean = ["equals", "contains"];
        var selectBooleanHtml = '<select class="selectBoolean"><option value="">Please select</option></select>';
        var selectItemHTML = '<select class="selectItem"><option value="">Please select</option></select>';
        var selectHtml = 
            `<div class="selectItemContainer">
                ${selectTypeHtml}
                ${selectBooleanHtml}
                ${selectItemHTML}
            </div>`
        $('#dashboard').append(
            `<div class="searchContainer">
                Filtery by:
                <div class="selectContainer">
                    ${selectHtml}
                </div>
                <div class="buttonContainer">
                    <button class="addFilterButton">Add New Filter</button>
                    <button class="filterButton" disabled>Filter</button>
                </div>
            </div>`
        );

        function addTypes(index) {
            selectType.forEach(function(item) {
                $('.selectTypes').eq(index.toString()).append(`<option value="${item}">${item}</option>`);
            });
        };

        function addBoolean(index) {
            selectBoolean.forEach(function(item) {
                $('.selectBoolean').eq(index.toString()).append(`<option value="${item}">${item}</option>`);
            });
        };

        function checkValid() {
            Object.keys(results).forEach(function(select) {
                $(".filterButton").prop("disabled", false);
                if (!results[select].selectedType || !results[select].selectedBoolean || !results[select].selectedItem) {
                    return $(".filterButton").prop("disabled", true);
                }
            });
        };

        function resetItems(index) {
            $('.selectItem').eq(index.toString()).empty();
            $('.selectItem').eq(index.toString()).val("");
            $('.selectItem').eq(index.toString()).append('<option value="">Please select</option>');
            results["select" + index].selectedItem = "";
            results["select" + index].selectedIds = [];
            checkValid();
        }

        function getItemsIds(index) {
            var currentType = results["select" + index].selectedType;
            var currentBoolean = results["select" + index].selectedBoolean;
            var currentItem = results["select" + index].selectedItem;
            if (currentBoolean && currentItem) {
                if (currentBoolean === "equals") {
                    results["select" + index].selectedIds = _this.modelData.getIds(currentType, currentItem);
                } else if (currentBoolean === "contains") {
                    var itemsArray = Object.keys(_this.modelData._modelData[currentType]).filter(function(item) {
                        return item.includes(currentItem);
                    });
                    var idsArray = [];
                    itemsArray.forEach(function(item) {
                        idsArray.push(_this.modelData.getIds(currentType, item));
                    });
                    results["select" + index].selectedIds = idsArray.reduce(function(arr1, arr2) {
                        return arr1.concat(arr2);
                    });
                };
            };
        };
        
        function addChangeSelectTypes() {
            $(".selectTypes").change(function() {
                var index = $(this).parent().index();
                var selectedType = $(this).val();
                results["select" + index].selectedType = selectedType;
                resetItems(index);
                if (selectedType) {
                    Object.keys(_this.modelData._modelData[selectedType]).forEach(function(item) {
                        $('.selectItem').eq(index.toString()).append(`<option value="${item}">${item}</option>`);
                    });
                };
                checkValid();
            });
        };

        function addChangeSelectBoolean() {
            $(".selectBoolean").change(function() {
                var index = $(this).parent().index();
                var selectedBoolean = $(this).val();
                results["select" + index].selectedBoolean = selectedBoolean;
                getItemsIds(index);
                checkValid();
            });
        };

        function addChangeSelectItem() {
            $(".selectItem").change(function() {
                var index = $(this).parent().index();
                var selectedItem = $(this).val();
                results["select" + index].selectedItem = selectedItem;
                getItemsIds(index);
                checkValid();
            });
        };

        function initBindings(index) {
            addTypes(index);
            addBoolean(index);
            addChangeSelectTypes();
            addChangeSelectBoolean();
            addChangeSelectItem();
        };

        initBindings(0);

        $(".addFilterButton").click(function() {
            $(".selectContainer").append(selectHtml);
            var newElIndex = $(".selectItemContainer").length - 1;
            initBindings(newElIndex);
            results["select" + newElIndex] = {
                selectedType: "",
                selectedBoolean: "",
                selectedItem: "",
                selectedIds: []
            }
            checkValid();
        });

        $(".filterButton").click(function() {
            var resultsObjByType = {};
            Object.keys(results).forEach(function(select) {
                var currentType = results[select].selectedType;
                if (resultsObjByType.hasOwnProperty(currentType)) {
                    var resultIds = resultsObjByType[currentType];
                    resultsObjByType[currentType] = resultIds.concat(results[select].selectedIds);
                } else {
                    resultsObjByType[currentType] = results[select].selectedIds;
                };
            });
            function intersect(a, b) {
                var t;
                if (b.length > a.length) t = b, b = a, a = t;
                return a.filter(function (e) {
                    return b.indexOf(e) > -1;
                });
            };
            var resultArr = Object.values(resultsObjByType).reduce(function(arr1, arr2) {
                return intersect(arr1, arr2);
            });
            _this.viewer.isolate(resultArr);
            _this.viewer.utilities.fitToView();
        });
    }
}